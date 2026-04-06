import { useState, useEffect } from 'react'
import api from '../api'

/**
 * Хук для управления тренировками
 */
export function useWorkouts(fromDate = null, toDate = null) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWorkouts()
  }, [fromDate, toDate])

  const loadWorkouts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      const { data } = await api.get('/workouts', { params })
      setWorkouts(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка загрузки тренировок')
    } finally {
      setLoading(false)
    }
  }

  const createWorkout = async (workoutData) => {
    setError(null)
    try {
      const { data } = await api.post('/workouts', workoutData)
      setWorkouts(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка создания тренировки')
      throw err
    }
  }

  const deleteWorkout = async (workoutId) => {
    setError(null)
    try {
      await api.delete(`/workouts/${workoutId}`)
      setWorkouts(prev => prev.filter(w => w.id !== workoutId))
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка удаления тренировки')
      throw err
    }
  }

  const addExercise = async (workoutId, exerciseData) => {
    setError(null)
    try {
      const { data } = await api.post(`/workouts/${workoutId}/exercises`, exerciseData)
      setWorkouts(prev => prev.map(w =>
        w.id === workoutId
          ? { ...w, exercises: [...(w.exercises || []), data] }
          : w
      ))
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка добавления упражнения')
      throw err
    }
  }

  return {
    workouts,
    loading,
    error,
    loadWorkouts,
    createWorkout,
    deleteWorkout,
    addExercise
  }
}
