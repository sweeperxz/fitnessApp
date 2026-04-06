// Service Worker для оффлайн работы и push уведомлений
const CACHE_NAME = 'nutrio-v1'
const OFFLINE_URL = '/offline.html'

// Файлы для кэширования
const STATIC_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json'
]

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_CACHE).catch(err => {
        console.warn('[SW] Failed to cache some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Стратегия кэширования: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Игнорируем не-GET запросы
  if (event.request.method !== 'GET') return

  // Игнорируем chrome extensions и другие схемы
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Клонируем ответ для кэша
        const responseToCache = response.clone()

        // Кэшируем только успешные ответы
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся взять из кэша
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Если это навигация и нет в кэше, показываем оффлайн страницу
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }

          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  const data = event.data ? event.data.text() : 'Новое уведомление'

  const options = {
    body: data,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'nutrio-notification',
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification('Nutrio', options)
  )
})

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})
