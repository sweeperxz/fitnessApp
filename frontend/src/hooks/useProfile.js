import { useState, useEffect } from 'react'
import { getProfile, upsertProfile } from '../api'
import api from '../api'

/**
 * Хук для управления профилем пользователя
 * Бизнес-логика расчетов вынесена на backend
 */
export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProfile()
      setProfile(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (profileData) => {
    setSaving(true)
    setError(null)
    try {
      const data = await upsertProfile(profileData)
      setProfile(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка сохранения профиля')
      throw err
    } finally {
      setSaving(false)
    }
  }

  /**
   * Расчет целей через backend API
   * Вся бизнес-логика на сервере
   */
  const calculateGoals = async (weight, goal, activity, height = 175, age = 30, gender = 'male') => {
    setError(null)
    try {
      const { data } = await api.post('/profile/calculate-goals', {
        weight,
        height,
        age,
        gender,
        goal,
        activity
      })
      return {
        calories_goal: data.calories_goal,
        protein_goal: data.protein_goal,
        fat_goal: data.fat_goal,
        carbs_goal: data.carbs_goal,
        water_goal: data.water_goal
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка расчета целей')
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    saving,
    loadProfile,
    saveProfile,
    calculateGoals
  }
}
