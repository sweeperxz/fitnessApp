import { useCallback, useEffect, useRef, useState } from 'react'
import { addMeal, deleteMeal, logWater } from '../../../api'
import { successHaptic } from '../../../utils/haptic'
import {
  addPendingSync,
  getPendingSync,
  removePendingSync,
} from '../../../utils/offlineStorage'

export function useTodaySync({ day, load, setData, setIsOffline }) {
  const [syncing, setSyncing] = useState(false)
  const [hasUnsyncedData, setHasUnsyncedData] = useState(false)
  const [showSyncSuccess, setShowSyncSuccess] = useState(false)
  const hideSuccessTimerRef = useRef(null)

  const refreshUnsynced = useCallback(() => {
    const pending = getPendingSync()
    setHasUnsyncedData(pending.length > 0)
    return pending
  }, [])

  useEffect(() => {
    refreshUnsynced()
  }, [refreshUnsynced])

  useEffect(() => {
    return () => {
      if (hideSuccessTimerRef.current) {
        clearTimeout(hideSuccessTimerRef.current)
      }
    }
  }, [])

  const queueWaterOffline = useCallback((ml) => {
    addPendingSync({
      type: 'logWater',
      data: { day: day.format('YYYY-MM-DD'), amount_ml: ml },
    })

    setData(prev => ({
      ...prev,
      water_ml: prev.water_ml + ml,
    }))

    setHasUnsyncedData(true)
  }, [day, setData])

  const queueAddMealOffline = useCallback((meal) => {
    addPendingSync({
      type: 'addMeal',
      data: { ...meal, day: day.format('YYYY-MM-DD') },
    })

    const newMeal = {
      ...meal,
      id: Date.now(),
      meal_type: meal.meal_type,
      created_at: new Date().toISOString(),
    }

    setData(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal],
      total_calories: prev.total_calories + meal.calories,
      total_protein: prev.total_protein + (meal.protein || 0),
      total_fat: prev.total_fat + (meal.fat || 0),
      total_carbs: prev.total_carbs + (meal.carbs || 0),
    }))

    setHasUnsyncedData(true)
  }, [day, setData])

  const handleOnlineSync = useCallback(async () => {
    setIsOffline(false)
    setSyncing(true)

    try {
      const pending = getPendingSync()
      let synced = 0
      let rejected = 0

      for (const operation of pending) {
        try {
          if (operation.type === 'addMeal') {
            await addMeal(operation.data)
          } else if (operation.type === 'deleteMeal') {
            await deleteMeal(operation.data.id)
          } else if (operation.type === 'logWater') {
            await logWater(operation.data)
          }

          removePendingSync(operation.id)
          synced += 1
        } catch (e) {
          const status = e?.response?.status
          if (status >= 400 && status < 500) {
            removePendingSync(operation.id)
            rejected += 1
          }
        }
      }

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
