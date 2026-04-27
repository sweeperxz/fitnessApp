const CACHE = `nutrio-v${self.__WB_BUILD_ID || Date.now()}`
const STATIC = ['/']
const INJECTED = (self.__WB_MANIFEST || []).map(e => e.url)
const FULL_STATIC = [...new Set([...STATIC, ...INJECTED])].filter(url => {
  if (url === '/index.html' && INJECTED.includes('index.html')) return false
  return true
})

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FULL_STATIC))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Игнорируем расширения Chrome и прочие не http/https схемы
  if (!url.protocol.startsWith('http')) return

  // API GET requests — network first, fallback to cache
  if (url.pathname.startsWith('/api/') && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(e.request, clone))
          }
          return res
        })
        .catch(() => caches.match(e.request).then(r => r || new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } })))
    )
    return
  }

  // API POST/PUT/DELETE — network only; app-level queues handle offline writes.
  if (url.pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(e.request.method)) {
    e.respondWith(fetch(e.request.clone()))
    return
  }

  // Статика — сначала сеть, fallback кэш
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Кэшируем только успешные ответы
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  )
})

//── Push Notifications ────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.text() : 'Новое уведомление от Nutrio'
  const options = {
    body: data,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'explore', title: 'Открыть приложение' },
      { action: 'close', title: 'Закрыть' },
    ]
  }
  e.waitUntil(self.registration.showNotification('Nutrio', options))
})

self.addEventListener('notificationclick', e => {
  const notification = e.notification
  const action = e.action
  if (action === 'close') {
    notification.close()
  } else {
    e.waitUntil(clients.openWindow('/'))
    notification.close()
  }
})

