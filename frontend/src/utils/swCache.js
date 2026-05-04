/**
 * Утилиты для работы с SW-кешем.
 *
 * Исторически SW (см. `sw.js`) делал network-first для всех `/api/*` GET и
 * клал успешные ответы в общий кеш `nutrio-v<BUILD_ID>`. Кеш-ключ — URL без
 * учёта Authorization-заголовка. На shared-устройстве (в семье или в офисе)
 * это утечка приватных данных: после logout юзера A в кеше остаются его
 * `/api/profile`, `/api/auth/me`, `/api/nutrition/...`. Когда юзер B
 * логинится в том же браузере и уходит в оффлайн — SW отдаёт ему данные A.
 *
 * Чтобы это починить, на logout вычищаем все API-записи из всех SW-кешей.
 * Статика (хешированные `/assets/*.js`, иконки) остаётся в кеше — она не
 * приватна, и оставлять её ускоряет следующий логин.
 */

const API_PATH_PREFIX = '/api/'

export async function clearApiResponseCache() {
  if (typeof caches === 'undefined') return // SW недоступен (старый браузер / Node-тесты)

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name)
        const requests = await cache.keys()
        await Promise.all(
          requests
            .filter((req) => {
              try {
                return new URL(req.url).pathname.startsWith(API_PATH_PREFIX)
              } catch {
                return false
              }
            })
            .map((req) => cache.delete(req)),
        )
      }),
    )
  } catch (err) {
    // Не валим logout, если SW по какой-то причине недоступен.
    console.warn('Failed to clear API cache on logout:', err)
  }
}
