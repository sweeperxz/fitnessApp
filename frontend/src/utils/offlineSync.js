/**
 * Унифицированная очередь оффлайн-записей.
 *
 * До этого в коде сосуществовали две очереди:
 *   - `utils/offlineQueue.js` — generic axios-replay (срабатывал из interceptor)
 *   - `utils/offlineStorage.js` -> `addPendingSync` — типизированные операции
 *     для страницы Today (addMeal/deleteMeal/logWater)
 * Они писали в разные ключи localStorage и независимо друг от друга
 * пытались синкаться при возврате online: дубли + рассинхрон состояния.
 *
 * Этот модуль заменяет обе. Все pending-write операции идут как
 * (method, url, data) и проигрываются обычным axios-инстансом.
 *
 * Идемпотентность: если в `data` нет `op_id`, мы его генерируем здесь же.
 * Бэк (`SyncOperation`) дедуплицирует по op_id для /nutrition/* — один и тот
 * же payload, проигранный дважды, не создаст дублей.
 *
 * Сетевые/5xx ошибки оставляют запись в очереди до следующей попытки;
 * 4xx интерпретируется как "сервер отверг — выкидываем без ретраев".
 */

const STORAGE_KEY = 'nutrio_write_queue'
// Легаси-ключи. Мигрируем их содержимое в новую очередь при первом обращении.
const LEGACY_GENERIC_QUEUE = 'nutrio_offline_queue'
const LEGACY_PENDING_SYNC = 'nutrio_pending_sync'

const listeners = new Set()
let migrated = false

function generateOpId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function ensureOpId(url, data) {
  if (!data || typeof data !== 'object') return data
  // op_id осмыслен только для эндпоинтов, у которых бэк его читает.
  // /nutrition/meal и /nutrition/water — основные кандидаты.
  if (data.op_id) return data
  if (url.startsWith('/nutrition/meal') || url.startsWith('/nutrition/water')) {
    return { ...data, op_id: generateOpId() }
  }
  return data
}

function readRaw(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function migrateLegacyQueues() {
  if (migrated) return
  migrated = true

  const legacyGeneric = readRaw(LEGACY_GENERIC_QUEUE)
  const legacyTyped = readRaw(LEGACY_PENDING_SYNC)
  if (legacyGeneric.length === 0 && legacyTyped.length === 0) return

  const current = readRaw(STORAGE_KEY)

  // Generic-очередь хранила { method, url, data } напрямую.
  for (const item of legacyGeneric) {
    if (item && item.method && item.url) {
      current.push({
        id: item.id || `${Date.now()}-legacy-${Math.random().toString(36).slice(2, 6)}`,
        method: item.method,
        url: item.url,
        data: ensureOpId(item.url, item.data),
        timestamp: item.timestamp || Date.now(),
      })
    }
  }

  // Типизированная очередь Today (`addPendingSync`) хранила { type, data }.
  for (const item of legacyTyped) {
    if (!item || !item.type) continue
    if (item.type === 'addMeal') {
      current.push({
        id: `${Date.now()}-legacy-meal-${Math.random().toString(36).slice(2, 6)}`,
        method: 'post',
        url: '/nutrition/meal',
        data: ensureOpId('/nutrition/meal', item.data),
        timestamp: item.timestamp || Date.now(),
      })
    } else if (item.type === 'logWater') {
      current.push({
        id: `${Date.now()}-legacy-water-${Math.random().toString(36).slice(2, 6)}`,
        method: 'post',
        url: '/nutrition/water',
        data: ensureOpId('/nutrition/water', item.data),
        timestamp: item.timestamp || Date.now(),
      })
    } else if (item.type === 'deleteMeal' && item.data?.id) {
      current.push({
        id: `${Date.now()}-legacy-meal-del-${Math.random().toString(36).slice(2, 6)}`,
        method: 'delete',
        url: `/nutrition/meal/${item.data.id}`,
        data: null,
        timestamp: item.timestamp || Date.now(),
      })
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  localStorage.removeItem(LEGACY_GENERIC_QUEUE)
  localStorage.removeItem(LEGACY_PENDING_SYNC)
}

function getQueue() {
  migrateLegacyQueues()
  return readRaw(STORAGE_KEY)
}

function saveQueue(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  listeners.forEach(fn => fn(queue.length))
}

/**
 * Поставить запись в очередь. Возвращает новый размер очереди.
 *
 * @param {'post'|'put'|'delete'} method
 * @param {string} url       абсолютный путь относительно baseURL axios (например `/nutrition/meal`)
 * @param {*}      data      payload (для DELETE — обычно `null`)
 */
export function enqueue(method, url, data) {
  const queue = getQueue()
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    url,
    data: ensureOpId(url, data),
    timestamp: Date.now(),
  })
  saveQueue(queue)
  return queue.length
}

export function getQueueSize() {
  return getQueue().length
}

/** Подписка на изменения размера очереди. Возвращает unsubscribe-функцию. */
export function onQueueChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Очистить очередь (для logout, не для штатного использования). */
export function clearQueue() {
  saveQueue([])
  localStorage.removeItem(LEGACY_GENERIC_QUEUE)
  localStorage.removeItem(LEGACY_PENDING_SYNC)
}

let flushing = false

/**
 * Прогнать всю очередь через переданный axios-инстанс.
 * Удаляет успешные и 4xx (rejected) записи, оставляет network/5xx.
 */
export async function flush(axiosInstance) {
  if (flushing) return { synced: 0, failed: 0, rejected: 0 }
  const queue = getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0, rejected: 0 }

  flushing = true
  let synced = 0
  let rejected = 0
  const failed = []

  try {
    for (const item of queue) {
      try {
        const config = { skipOfflineQueue: true }
        if (item.method === 'post') {
          await axiosInstance.post(item.url, item.data, config)
        } else if (item.method === 'put') {
          await axiosInstance.put(item.url, item.data, config)
        } else if (item.method === 'delete') {
          await axiosInstance.delete(item.url, config)
        } else {
          // Неизвестный метод — пропускаем, чтобы очередь не зависала.
          rejected += 1
          continue
        }
        synced += 1
      } catch (err) {
        if (!err.response) {
          // Сеть ещё не вернулась — оставляем в очереди.
          failed.push(item)
          continue
        }

        const status = err.response.status
        if (status >= 400 && status < 500) {
          // Сервер сказал "не приму" — выкидываем без бесконечного ретрая.
          rejected += 1
        } else {
          failed.push(item)
        }
      }
    }
  } finally {
    saveQueue(failed)
    flushing = false
  }

  return { synced, failed: failed.length, rejected }
}

let autoFlushSetup = false

async function tryFlush(axiosInstance, onSynced) {
  const result = await flush(axiosInstance)
  if (result.synced > 0 || result.rejected > 0) {
    onSynced?.(result)
  }
}

/**
 * Подписаться на возврат онлайна и запускать flush. Вызывается один раз
 * при инициализации API-клиента.
 *
 * Дополнительно: если на момент инициализации в очереди уже что-то лежит
 * и навигатор онлайн — сразу запускаем flush. Это покрывает сценарий B7:
 * юзер залогировал воду в оффлайне, закрыл вкладку, в следующий раз
 * открыл уже онлайн — событие `online` не срабатывает (оно бывает только
 * при переходе offline→online), и записи висели в очереди до следующего
 * случайного toggle сети. Теперь сливаются на старте.
 */
export function setupAutoFlush(axiosInstance, onSynced) {
  if (autoFlushSetup) return
  autoFlushSetup = true

  window.addEventListener('online', () => tryFlush(axiosInstance, onSynced))

  // Стартовый flush. Делаем через micro-task, чтобы не блокировать импорт
  // и дать другим частям API настроить interceptors.
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    if (getQueueSize() > 0) {
      Promise.resolve().then(() => tryFlush(axiosInstance, onSynced))
    }
  }
}
