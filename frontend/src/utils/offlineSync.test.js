/**
 * Тесты унифицированной очереди оффлайн-записи.
 *
 * `migrated` и автоподписки — это модульный state. Чтобы тесты не
 * перетекали друг в друга, перед каждым перегружаем модуль через
 * `vi.resetModules()` и динамически импортируем свежий экземпляр.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const STORAGE_KEY = 'nutrio_write_queue'

// Чистим localStorage между тестами, иначе очередь из одного теста
// "просачивается" в следующий и тесты на стартовый flush видят чужую запись.
beforeEach(() => {
  localStorage.clear()
})

// Лениво подгружаем свежий модуль после resetModules — иначе модульный
// флаг `migrated` остаётся true с прошлого теста.
async function freshModule() {
  vi.resetModules()
  return await import('./offlineSync')
}

function readQueue() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

function makeMockAxios(responses) {
  const calls = []
  let i = 0
  const next = () => {
    const resolver = responses[i++]
    if (!resolver) throw new Error(`mock axios: unexpected call ${i}`)
    return resolver()
  }
  return {
    calls,
    post: vi.fn(async (url, data, config) => {
      calls.push({ method: 'post', url, data, config })
      return next()
    }),
    put: vi.fn(async (url, data, config) => {
      calls.push({ method: 'put', url, data, config })
      return next()
    }),
    delete: vi.fn(async (url, config) => {
      calls.push({ method: 'delete', url, config })
      return next()
    }),
  }
}

describe('enqueue', () => {
  it('adds entry to localStorage', async () => {
    const { enqueue, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'Eggs', calories: 200 })
    expect(getQueueSize()).toBe(1)
    const [entry] = readQueue()
    expect(entry.method).toBe('post')
    expect(entry.url).toBe('/nutrition/meal')
    expect(entry.data.name).toBe('Eggs')
  })

  it('auto-injects op_id for /nutrition/meal when missing', async () => {
    const { enqueue } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'Eggs' })
    const [entry] = readQueue()
    expect(typeof entry.data.op_id).toBe('string')
    expect(entry.data.op_id.length).toBeGreaterThan(0)
  })

  it('auto-injects op_id for /nutrition/water when missing', async () => {
    const { enqueue } = await freshModule()
    enqueue('post', '/nutrition/water', { day: '2025-01-01', amount_ml: 250 })
    const [entry] = readQueue()
    expect(typeof entry.data.op_id).toBe('string')
  })

  it('preserves explicit op_id', async () => {
    const { enqueue } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'X', op_id: 'fixed-id' })
    const [entry] = readQueue()
    expect(entry.data.op_id).toBe('fixed-id')
  })

  it('does not inject op_id for non-nutrition endpoints', async () => {
    const { enqueue } = await freshModule()
    enqueue('post', '/workouts', { day: '2025-01-01' })
    const [entry] = readQueue()
    expect(entry.data.op_id).toBeUndefined()
  })

  it('handles null payload (e.g. DELETE)', async () => {
    const { enqueue } = await freshModule()
    enqueue('delete', '/nutrition/meal/42', null)
    const [entry] = readQueue()
    expect(entry.data).toBeNull()
  })
})

describe('legacy queue migration', () => {
  it('imports nutrio_offline_queue entries on first read', async () => {
    localStorage.setItem(
      'nutrio_offline_queue',
      JSON.stringify([
        { method: 'post', url: '/workouts', data: { title: 'leg day' }, timestamp: 100 },
      ])
    )
    const { getQueueSize } = await freshModule()
    expect(getQueueSize()).toBe(1)
    expect(readQueue()[0].url).toBe('/workouts')
    expect(localStorage.getItem('nutrio_offline_queue')).toBeNull()
  })

  it('imports typed nutrio_pending_sync entries with op_id', async () => {
    localStorage.setItem(
      'nutrio_pending_sync',
      JSON.stringify([
        { type: 'addMeal', data: { day: '2025-01-01', name: 'X', calories: 100 }, timestamp: 200 },
        { type: 'logWater', data: { day: '2025-01-01', amount_ml: 250 }, timestamp: 201 },
        { type: 'deleteMeal', data: { id: 7 }, timestamp: 202 },
      ])
    )
    const { getQueueSize } = await freshModule()
    expect(getQueueSize()).toBe(3)

    const queue = readQueue()
    const meal = queue.find(q => q.url === '/nutrition/meal' && q.method === 'post')
    expect(meal).toBeTruthy()
    expect(meal.data.op_id).toBeDefined()

    const water = queue.find(q => q.url === '/nutrition/water')
    expect(water).toBeTruthy()
    expect(water.data.op_id).toBeDefined()

    const del = queue.find(q => q.method === 'delete')
    expect(del.url).toBe('/nutrition/meal/7')

    expect(localStorage.getItem('nutrio_pending_sync')).toBeNull()
  })

  it('legacy migration runs only once per module load', async () => {
    localStorage.setItem(
      'nutrio_offline_queue',
      JSON.stringify([{ method: 'post', url: '/workouts', data: {}, timestamp: 1 }])
    )
    const { getQueueSize } = await freshModule()
    expect(getQueueSize()).toBe(1)

    // Если закинуть legacy-ключ снова — повторного импорта не должно быть.
    localStorage.setItem(
      'nutrio_offline_queue',
      JSON.stringify([{ method: 'post', url: '/workouts/2', data: {}, timestamp: 2 }])
    )
    expect(getQueueSize()).toBe(1)
    // Legacy-ключ при втором чтении не дочитываем — флаг `migrated` уже
    // выставлен, так что новый legacy-блоб остаётся нетронутым.
    expect(localStorage.getItem('nutrio_offline_queue')).not.toBeNull()
  })
})

describe('onQueueChange', () => {
  it('notifies listeners when queue size changes', async () => {
    const { enqueue, onQueueChange } = await freshModule()
    const listener = vi.fn()
    const unsub = onQueueChange(listener)

    enqueue('post', '/x', {})
    enqueue('post', '/y', {})

    expect(listener).toHaveBeenCalledWith(1)
    expect(listener).toHaveBeenCalledWith(2)

    unsub()
    enqueue('post', '/z', {})
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('clearQueue', () => {
  it('empties write queue and removes legacy keys', async () => {
    const { enqueue, clearQueue, getQueueSize } = await freshModule()
    enqueue('post', '/x', {})
    localStorage.setItem('nutrio_offline_queue', '[]')
    localStorage.setItem('nutrio_pending_sync', '[]')

    clearQueue()
    expect(getQueueSize()).toBe(0)
    expect(localStorage.getItem('nutrio_offline_queue')).toBeNull()
    expect(localStorage.getItem('nutrio_pending_sync')).toBeNull()
  })
})

describe('flush', () => {
  it('removes successfully synced entries', async () => {
    const { enqueue, flush, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'A', calories: 100 })
    enqueue('post', '/nutrition/water', { day: '2025-01-01', amount_ml: 250 })

    const axios = makeMockAxios([
      () => ({ data: { id: 1 } }),
      () => ({ data: { id: 2 } }),
    ])

    const result = await flush(axios)
    expect(result.synced).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.rejected).toBe(0)
    expect(getQueueSize()).toBe(0)
    expect(axios.calls).toHaveLength(2)
    // skipOfflineQueue прокидывается, чтобы interceptor не зациклил
    // повторную постановку при сетевой ошибке во время flush.
    expect(axios.calls[0].config.skipOfflineQueue).toBe(true)
  })

  it('keeps entries on network errors', async () => {
    const { enqueue, flush, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'A', calories: 100 })

    const axios = makeMockAxios([
      () => { const err = new Error('boom'); err.response = undefined; throw err },
    ])

    const result = await flush(axios)
    expect(result.synced).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.rejected).toBe(0)
    expect(getQueueSize()).toBe(1)
  })

  it('drops entries on 4xx errors (rejected by server)', async () => {
    const { enqueue, flush, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'A', calories: 100 })

    const axios = makeMockAxios([
      () => {
        const err = new Error('rejected')
        err.response = { status: 422 }
        throw err
      },
    ])

    const result = await flush(axios)
    expect(result.synced).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.rejected).toBe(1)
    expect(getQueueSize()).toBe(0)
  })

  it('keeps entries on 5xx errors', async () => {
    const { enqueue, flush, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'A', calories: 100 })

    const axios = makeMockAxios([
      () => {
        const err = new Error('server boom')
        err.response = { status: 503 }
        throw err
      },
    ])

    const result = await flush(axios)
    expect(result.synced).toBe(0)
    expect(result.failed).toBe(1)
    expect(getQueueSize()).toBe(1)
  })

  it('does nothing when queue is empty', async () => {
    const { flush } = await freshModule()
    const axios = makeMockAxios([])
    const result = await flush(axios)
    expect(result.synced).toBe(0)
    expect(axios.calls).toHaveLength(0)
  })
})

// ── setupAutoFlush ──────────────────────────────────────────
// B7: на старте, если очередь не пуста и навигатор онлайн — flush
// должен запуститься без необходимости в offline→online toggle.
describe('setupAutoFlush startup flush (B7)', () => {
  beforeEach(() => {
    // jsdom по умолчанию навигатор онлайн.
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  })

  it('flushes pending queue on init when navigator is online', async () => {
    const { enqueue, setupAutoFlush, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'A', calories: 100 })

    const axios = makeMockAxios([
      () => ({ data: { ok: true } }),
    ])

    setupAutoFlush(axios)
    // Стартовый flush уходит в micro-task; ждём её завершения.
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))

    expect(axios.calls).toHaveLength(1)
    expect(getQueueSize()).toBe(0)
  })

  it('does NOT flush on init when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    const { enqueue, setupAutoFlush, getQueueSize } = await freshModule()
    enqueue('post', '/nutrition/meal', { day: '2025-01-01', name: 'A', calories: 100 })

    const axios = makeMockAxios([])
    setupAutoFlush(axios)
    await new Promise(r => setTimeout(r, 0))

    expect(axios.calls).toHaveLength(0)
    expect(getQueueSize()).toBe(1)
  })

  it('does NOT flush on init when queue is empty', async () => {
    const { setupAutoFlush } = await freshModule()
    const axios = makeMockAxios([])
    setupAutoFlush(axios)
    await new Promise(r => setTimeout(r, 0))

    expect(axios.calls).toHaveLength(0)
  })
})
