import api from '../api'

export const getWorkouts = (params) => api.get('/workouts', { params }).then(r => r.data)
export const createWorkout = (data) => api.post('/workouts', data).then(r => r.data)
export const updateWorkout = (id, data) => api.put(`/workouts/${id}`, data).then(r => r.data)
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`)
export const addExercise = (wid, data) => api.post(`/workouts/${wid}/exercises`, data).then(r => r.data)

const WorkoutService = {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addExercise
}

export default WorkoutService
