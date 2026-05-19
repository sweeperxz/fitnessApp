import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiResponseCache } from './swCache'

/**
 * Минимальный мок Cache Storage API для unit-тестов: имитируем
 * глобальный `caches` с двумя кешами и набором запросов в каждом.
 */
function makeFakeCache(entries) {
  const requests = entries.map((url) => new Request(url))
  return {
    keys: vi.fn(async () => requests),
    delete: vi.fn(async () => true),
  }
}

let originalCaches

beforeEach(() => {
  originalCaches = globalThis.caches
})

afterEach(() => {
  globalThis.caches = originalCaches
  vi.restoreAllMocks()
})

describe('clearApiResponseCache', () => {
  it('удаляет только /api/* записи, оставляя статику в кеше', async () => {
    const apiOnly = makeFakeCache([
      'https://app.example/api/profile',
      'https://app.example/api/auth/me',
      'https://app.example/assets/index-abc.js',
      'https://app.example/icons/192.png',
    ])

    globalThis.caches = {
      keys: vi.fn(async () => ['nutrio-v123']),
      open: vi.fn(async () => apiOnly),
    }

    await clearApiResponseCache()

    // Из 4-х записей удалены ровно 2 /api/* — статика осталась.
    expect(apiOnly.delete).toHaveBeenCalledTimes(2)
    const deletedUrls = apiOnly.delete.mock.calls.map(([req]) => req.url)
    expect(deletedUrls).toEqual(
      expect.arrayContaining([
        'https://app.example/api/profile',
        'https://app.example/api/auth/me',
      ]),
    )
    expect(deletedUrls).not.toContain('https://app.example/assets/index-abc.js')
    expect(deletedUrls).not.toContain('https://app.example/icons/192.png')
  })

  it('обходит несколько cache-имён', async () => {
    const c1 = makeFakeCache(['https://app.example/api/stats'])
    const c2 = makeFakeCache(['https://app.example/api/today'])

    globalThis.caches = {
      keys: vi.fn(async () => ['nutrio-v1', 'nutrio-v2']),
      open: vi.fn(async (name) => (name === 'nutrio-v1' ? c1 : c2)),
    }

    await clearApiResponseCache()

    expect(c1.delete).toHaveBeenCalledTimes(1)
    expect(c2.delete).toHaveBeenCalledTimes(1)
  })

  it('не падает, если caches API недоступен (старый браузер / Node)', async () => {
    delete globalThis.caches
    // Просто не должно бросить.
    await expect(clearApiResponseCache()).resolves.toBeUndefined()
  })

  it('глотает ошибки внутри caches API, чтобы не валить logout-флоу', async () => {
    globalThis.caches = {
      keys: vi.fn(async () => {
        throw new Error('cache busted')
      }),
      open: vi.fn(),
    }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(clearApiResponseCache()).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalled()
  })
})
