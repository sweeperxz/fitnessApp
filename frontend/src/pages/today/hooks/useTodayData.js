import { useCallback, useEffect, useRef, useState } from 'react'
import { getNutritionDay, getProfile } from '../../../api'
import {
  saveOfflineData,
  getOfflineData,
  markAsSynced,
} from '../../../utils/offlineStorage'

export const FALLBACK_PROFILE = {
  calories_goal: 2000,
  protein_goal: 150,
  fat_goal: 70,
  carbs_goal: 250,
  water_goal: 2500,
}

export const EMPTY_NUTRITION = {
  meals: [],
  total_calories: 0,
  total_protein: 0,
  total_fat: 0,
  total_carbs: 0,
  water_ml: 0,
}

export function useTodayData(day) {
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const loadIdRef = useRef(0)

  const load = useCallback(async () => {
    const dateStr = day.format('YYYY-MM-DD')
    const loadId = ++loadIdRef.current
    const isCurrentLoad = () => loadId === loadIdRef.current

    try {
      const [nutritionDay, userProfile] = await Promise.all([
        getNutritionDay(dateStr),
        getProfile().catch(() => FALLBACK_PROFILE),
      ])

      if (!isCurrentLoad()) return

      setData(nutritionDay)
      setProfile(userProfile)
      setIsOffline(false)

      saveOfflineData(`nutrition_${dateStr}`, nutritionDay)
      saveOfflineData('profile', userProfile)
      markAsSynced(`nutrition_${dateStr}`)
      markAsSynced('profile')
    } catch (err) {
      if (!isCurrentLoad()) return

      if (err.isOffline || !navigator.onLine) {
        setIsOffline(true)

        const cachedNutrition = getOfflineData(`nutrition_${dateStr}`)
        const cachedProfile = getOfflineData('profile')

        setData(cachedNutrition ? cachedNutrition.data : EMPTY_NUTRITION)
        setProfile(cachedProfile ? cachedProfile.data : FALLBACK_PROFILE)
        return
      }

      setData(EMPTY_NUTRITION)
      setProfile(FALLBACK_PROFILE)
    }
  }, [day])

  useEffect(() => {
    load()
  }, [load])

  return {
    data,
    profile,
    isOffline,
    setIsOffline,
    setData,
    load,
    fallbackProfile: FALLBACK_PROFILE,
    emptyNutrition: EMPTY_NUTRITION,
  }
}
