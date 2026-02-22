/**
 * Offline Queue — saves failed write requests and replays them when online
 *
 * Storage key: 'nutrio_offline_queue'
 * Each entry: { id, method, url, data, timestamp }
 */

const STORAGE_KEY = 'nutrio_offline_queue'
const listeners = new Set()

// ── Queue CRUD ──────────────────────────────────────────

function getQueue() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

function saveQueue(queue) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    listeners.forEach(fn => fn(queue.length))
}

export function enqueue(method, url, data) {
    const queue = getQueue()
    queue.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        method,
        url,
        data,
        timestamp: Date.now(),
    })
    saveQueue(queue)
    return queue.length
}

export function getQueueSize() {
    return getQueue().length
}

/** Subscribe to queue size changes */
export function onQueueChange(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

// ── Flush (replay all queued requests) ──────────────────

let flushing = false

export async function flush(axiosInstance) {
    if (flushing) return { synced: 0, failed: 0 }
    const queue = getQueue()
    if (!queue.length) return { synced: 0, failed: 0 }

    flushing = true
    let synced = 0
    const failed = []

    for (const item of queue) {
        try {
            if (item.method === 'post') {
                await axiosInstance.post(item.url, item.data)
            } else if (item.method === 'delete') {
                await axiosInstance.delete(item.url)
            }
            synced++
        } catch (err) {
            // If it's still a network error, keep in queue
            if (!err.response) {
                failed.push(item)
            } else {
                // Server returned an error (e.g. 404, 400) — discard, it won't help to retry
                synced++
            }
        }
    }

    saveQueue(failed)
    flushing = false
    return { synced, failed: failed.length }
}

// ── Auto-sync when back online ──────────────────────────

let autoFlushSetup = false

export function setupAutoFlush(axiosInstance, onSynced) {
    if (autoFlushSetup) return
    autoFlushSetup = true

    window.addEventListener('online', async () => {
        const result = await flush(axiosInstance)
        if (result.synced > 0) {
            onSynced?.(result)
        }
    })
}
