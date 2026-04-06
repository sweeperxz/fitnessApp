// Локальное хранилище для оффлайн режима
const STORAGE_KEY = 'nutrio_offline_data'
const PENDING_SYNC_KEY = 'nutrio_pending_sync'

// Сохранить данные локально
export function saveOfflineData(key, data) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    storage[key] = {
      data,
      timestamp: Date.now(),
      synced: false
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch (e) {
    console.error('Failed to save offline data:', e)
    return false
  }
}

// Получить локальные данные
export function getOfflineData(key) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return storage[key] || null
  } catch (e) {
    console.error('Failed to get offline data:', e)
    return null
  }
}

// Пометить данные как синхронизированные
export function markAsSynced(key) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (storage[key]) {
      storage[key].synced = true
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    }
  } catch (e) {
    console.error('Failed to mark as synced:', e)
  }
}

// Получить все несинхронизированные данные
export function getUnsyncedData() {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.entries(storage)
      .filter(([_, value]) => !value.synced)
      .map(([key, value]) => ({ key, ...value }))
  } catch (e) {
    console.error('Failed to get unsynced data:', e)
    return []
  }
}

// Добавить операцию в очередь синхронизации
export function addPendingSync(operation) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]')
    pending.push({
      ...operation,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    })
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending))
    return true
  } catch (e) {
    console.error('Failed to add pending sync:', e)
    return false
  }
}

// Получить очередь синхронизации
export function getPendingSync() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]')
  } catch (e) {
    console.error('Failed to get pending sync:', e)
    return []
  }
}

// Удалить операцию из очереди
export function removePendingSync(id) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]')
    const filtered = pending.filter(op => op.id !== id)
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered))
    return true
  } catch (e) {
    console.error('Failed to remove pending sync:', e)
    return false
  }
}

// Очистить все локальные данные
export function clearOfflineData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PENDING_SYNC_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear offline data:', e)
    return false
  }
}
