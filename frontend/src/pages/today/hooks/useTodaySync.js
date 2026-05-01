import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../../api'
import { successHaptic } from '../../../utils/haptic'
import { enqueue, flush, getQueueSize, onQueueChange } from '../../../utils/offlineSync'
import { saveOfflineData } from '../../../utils/offlineStorage'

/**
 * Хук синхронизации Today-страницы.
 *
 * До этого хранил параллельную очередь (`addPendingSync`/`getPendingSync`),
 * которая писала в свой ключ localStorage и перезаписывала статус
 * относительно `nutrio_offline_queue`. Сейчас использует единую очередь
 * `offlineSync` — pending-записи проигрываются обычным axios-инстансом
 * с тем же payload (включая `op_id`), что отдала бы UI напрямую.
 *
 * `saveOfflineData(...)` оставлен — это локальный read-cache, чтобы
 * UI продолжал показывать корректное "сегодня" в оффлайне. Очередь
 * записей и read-cache — разные вещи, не путать.
 */
export function useTodaySync({ day, load, setData, setIsOffline }) {
  const [syncing, setSyncing] = useState(false)
  const [hasUnsyncedData, setHasUnsyncedData] = useState(getQueueSize() > 0)
  const [showSyncSuccess, setShowSyncSuccess] = useState(false)
  const hideSuccessTimerRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onQueueChange((size) => setHasUnsyncedData(size > 0))
    return unsubscribe
  }, [])

  useEffect(() => {
    return () => {
      if (hideSuccessTimerRef.current) {
        clearTimeout(hideSuccessTimerRef.current)
      }
    }
  }, [])

  const refreshUnsynced = useCallback(() => {
    const size = getQueueSize()
    setHasUnsyncedData(size > 0)
    return size
  }, [])

  const queueWaterOffline = useCallback((ml) => {
    const dateStr = day.format('YYYY-MM-DD')
    enqueue('post', '/nutrition/water', { day: dateStr, amount_ml: ml })

    setData(prev => {
      const next = {
        meals: prev?.meals || [],
        total_calories: prev?.total_calories || 0,
        total_protein: prev?.total_protein || 0,
        total_fat: prev?.total_fat || 0,
        total_carbs: prev?.total_carbs || 0,
        water_ml: (prev?.water_ml || 0) + ml,
      }
      saveOfflineData(`nutrition_${dateStr}`, next)
      return next
    })

    setHasUnsyncedData(true)
  }, [day, setData])

  const queueAddMealOffline = useCallback((meal) => {
    const dateStr = day.format('YYYY-MM-DD')
    enqueue('post', '/nutrition/meal', { ...meal, day: dateStr })

    const newMeal = {
      ...meal,
      id: Date.now(),
      meal_type: meal.meal_type,
      created_at: new Date().toISOString(),
    }

    setData(prev => {
      const next = {
        meals: [...(prev?.meals || []), newMeal],
        total_calories: (prev?.total_calories || 0) + meal.calories,
        total_protein: (prev?.total_protein || 0) + (meal.protein || 0),
        total_fat: (prev?.total_fat || 0) + (meal.fat || 0),
        total_carbs: (prev?.total_carbs || 0) + (meal.carbs || 0),
        water_ml: prev?.water_ml || 0,
      }
      saveOfflineData(`nutrition_${dateStr}`, next)
      return next
    })

    setHasUnsyncedData(true)
  }, [day, setData])

  const handleOnlineSync = useCallback(async () => {
    setIsOffline(false)
    setSyncing(true)

    try {
      const result = await flush(api)
      const { synced, rejected } = result

      await load()
      refreshUnsynced()

      if (synced > 0 || rejected > 0) {
        window.dispatchEvent(new CustomEvent('nutrio:synced', { detail: { synced, rejected } }))
      }

      if (synced > 0) {
        successHaptic()
        setShowSyncSuccess(true)

        if (hideSuccessTimerRef.current) {
          clearTimeout(hideSuccessTimerRef.current)
        }

        hideSuccessTimerRef.current = setTimeout(() => {
          setShowSyncSuccess(false)
        }, 3000)
      }
    } catch (e) {
      console.error('Sync failed:', e)
    }

    setSyncing(false)
  }, [load, refreshUnsynced, setIsOffline])

  useEffect(() => {
    const handleOnline = () => {
      handleOnlineSync()
    }

    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnlineSync, setIsOffline])

  return {
    syncing,
    hasUnsyncedData,
    showSyncSuccess,
    queueWaterOffline,
    queueAddMealOffline,
    refreshUnsynced,
  }
}
