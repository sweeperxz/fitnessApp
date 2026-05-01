/**
 * Локальный read-cache для оффлайн-режима.
 *
 * Назначение узкое: сохранять последний успешный ответ от GET-эндпоинтов,
 * чтобы PWA в оффлайне могло отрисовать "что-то осмысленное" вместо
 * пустой страницы. Это НЕ очередь записей — для записи смотри
 * `utils/offlineSync.js`.
 */

const STORAGE_KEY = 'nutrio_offline_data'

export function saveOfflineData(key, data) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    storage[key] = {
      data,
      timestamp: Date.now(),
      synced: false,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch (e) {
    console.error('Failed to save offline data:', e)
    return false
  }
}

export function getOfflineData(key) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return storage[key] || null
  } catch (e) {
    console.error('Failed to get offline data:', e)
    return null
  }
}

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

export function clearOfflineData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear offline data:', e)
    return false
  }
}
