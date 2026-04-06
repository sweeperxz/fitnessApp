import { useState, useEffect } from 'react'
import api from '../api'

/**
 * Хук для управления приемами пищи
 */
export function useMeals(date) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (date) {
      loadMeals(date)
    }
  }, [date])

  const loadMeals = async (day) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/nutrition/${day}`)
      setMeals(data.meals || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка загрузки приемов пищи')
    } finally {
      setLoading(false)
    }
  }

  const addMeal = async (mealData) => {
    setError(null)
    try {
      const { data } = await api.post('/nutrition/meal', mealData)
      setMeals(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка добавления приема пищи')
      throw err
    }
  }

  const deleteMeal = async (mealId) => {
    setError(null)
    try {
      await api.delete(`/nutrition/meal/${mealId}`)
      setMeals(prev => prev.filter(m => m.id !== mealId))
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка удаления приема пищи')
      throw err
    }
  }

  const getTotalNutrition = () => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      fat: acc.fat + (meal.fat || 0),
      carbs: acc.carbs + (meal.carbs || 0)
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 })
  }

  return {
    meals,
    loading,
    error,
    loadMeals,
    addMeal,
    deleteMeal,
    getTotalNutrition
  }
}
