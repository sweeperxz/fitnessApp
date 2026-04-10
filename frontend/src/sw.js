const CACHE = `nutrio-v${self.__WB_BUILD_ID || Date.now()}`
const STATIC = ['/']
const INJECTED = (self.__WB_MANIFEST || []).map(e => e.url)
const FULL_STATIC = [...new Set([...STATIC, ...INJECTED])].filter(url => {
  if (url === '/index.html' && INJECTED.includes('index.html')) return false
  return true
})

const QUEUE_NAME = 'nutrio-offline-queue'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FULL_STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
  // Уведомляем клиенты что обновление применено
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(c => c.postMessage({ type: 'UPDATE_AVAILABLE' }))
  })
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
        .catch(() => caches.match(e.request).then(r => r || new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })))
    )
    return
  }

  // API POST/PUT/DELETE — network only, queue if offline
  if (url.pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(e.request.method)) {
    e.respondWith(
      fetch(e.request.clone())
        .catch(async () => {
          // Зберігаємо запит в IndexedDB для пізнішої синхронізації
          const requestData = {
            url: e.request.url,
            method: e.request.method,
            headers: Object.fromEntries(e.request.headers.entries()),
            body: await e.request.text(),
            timestamp: Date.now()
          }

          await saveToQueue(requestData)

          // Реєструємо background sync
          if (self.registration.sync) {
            await self.registration.sync.register('sync-offline-requests')
          }

          return new Response(
            JSON.stringify({ queued: true, message: 'Request queued for sync' }),
            { status: 202, headers: { 'Content-Type': 'application/json' } }
          )
        })
    )
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

// Принимаем команду на skip waiting
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
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

//── Background Sync для офлайн черги ───────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-offline-requests') {
    e.waitUntil(syncOfflineRequests())
  }
})

//── IndexedDB helpers ──────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nutrio-offline', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(QUEUE_NAME)) {
        db.createObjectStore(QUEUE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function saveToQueue(requestData) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_NAME, 'readwrite')
    const store = tx.objectStore(QUEUE_NAME)
    const request = store.add(requestData)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function getQueuedRequests() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_NAME, 'readonly')
    const store = tx.objectStore(QUEUE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function removeFromQueue(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_NAME, 'readwrite')
    const store = tx.objectStore(QUEUE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function syncOfflineRequests() {
  const requests = await getQueuedRequests()

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body || undefined
      })

      if (response.ok) {
        await removeFromQueue(req.id)
      }
    } catch (err) {
      // Залишаємо в черзі для наступної спроби
      console.log('Failed to sync request:', err)
    }
  }
}
