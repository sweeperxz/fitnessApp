import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network'; // Will need to install it: npx expo install expo-network

const STORAGE_KEY = 'nutrio_offline_queue'
const listeners = new Set()

async function getQueue() {
    try {
        const item = await AsyncStorage.getItem(STORAGE_KEY)
        return JSON.parse(item || '[]')
    } catch {
        return []
    }
}

async function saveQueue(queue) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    listeners.forEach(fn => fn(queue.length))
}

export async function enqueue(method, url, data) {
    const queue = await getQueue()
    queue.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        method,
        url,
        data,
        timestamp: Date.now(),
    })
    await saveQueue(queue)
    return queue.length
}

export async function getQueueSize() {
    const q = await getQueue();
    return q.length;
}

export function onQueueChange(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

let flushing = false

export async function flush(axiosInstance) {
    if (flushing) return { synced: 0, failed: 0 }
    const queue = await getQueue()
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
            if (!err.response) {
                failed.push(item)
            } else {
                synced++
            }
        }
    }

    await saveQueue(failed)
    flushing = false
    return { synced, failed: failed.length }
}

let autoFlushSetup = false

export function setupAutoFlush(axiosInstance, onSynced) {
    if (autoFlushSetup) return
    autoFlushSetup = true

    // Simple poll instead of window 'online' event since Network.addNetworkStateListener can be unreliable across reloads.
    setInterval(async () => {
        const netState = await Network.getNetworkStateAsync();
        if (netState.isConnected && netState.isInternetReachable) {
            const result = await flush(axiosInstance)
            if (result.synced > 0) {
                onSynced?.(result)
            }
        }
    }, 15000);
}
