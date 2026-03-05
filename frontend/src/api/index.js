import axios from 'axios'
import { enqueue, flush, setupAutoFlush } from '../utils/offlineQueue'
import { errorHaptic } from '../utils/haptic'

const api = axios.create({ baseURL: '/api' })

export const getToken = () => localStorage.getItem('ff_token')
export const setToken = (t) => localStorage.setItem('ff_token', t)
export const removeToken = () => localStorage.removeItem('ff_token')

api.interceptors.request.use(cfg => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    // Auth error — logout
    if (err.response?.status === 401) { removeToken(); window.location.reload() }

    // Network error on write request → save to offline queue
    if (!err.response && err.config) {
      const method = err.config.method
      if (method === 'post' || method === 'delete') {
        errorHaptic()
        enqueue(method, err.config.url, err.config.data ? JSON.parse(err.config.data) : null)
        // Return a fake success so the UI doesn't show an error
        return Promise.resolve({ data: { _offline: true } })
      }
    }

    errorHaptic()
    return Promise.reject(err)
  }
)

// Auto-sync queued requests when back online
setupAutoFlush(api, (result) => {
  window.dispatchEvent(new CustomEvent('nutrio:synced', { detail: result }))
})

export const register = d => api.post('/auth/register', d).then(r => r.data)
export const login = d => api.post('/auth/login', d).then(r => r.data)
export const googleAuth = d => api.post('/auth/google', d).then(r => r.data)
export const getMe = () => api.get('/auth/me').then(r => r.data)

export const getProfile = () => api.get('/profile').then(r => r.data)
export const upsertProfile = d => api.post('/profile', d).then(r => r.data)

export const getNutritionDay = day => api.get(`/nutrition/${day}`).then(r => r.data)
export const addMeal = d => api.post('/nutrition/meal', d).then(r => r.data)
export const deleteMeal = id => api.delete(`/nutrition/meal/${id}`)
export const logWater = d => api.post('/nutrition/water', d).then(r => r.data)

export const getWorkouts = p => api.get('/workouts', { params: p }).then(r => r.data)
export const createWorkout = d => api.post('/workouts', d).then(r => r.data)
export const addExercise = (wid, d) => api.post(`/workouts/${wid}/exercises`, d).then(r => r.data)
export const deleteWorkout = id => api.delete(`/workouts/${id}`)

export const getStats = (days = 30) => api.get('/stats', { params: { days } }).then(r => r.data)

export const sendChatMessage = d => api.post('/ai/chat', d).then(r => r.data)

export const getRecentFoods = () => api.get('/foods/recent').then(r => r.data)
export const addRecentFood = d => api.post('/foods/recent', d).then(r => r.data)

export const getAdminUsers = () => api.get('/admin/users').then(r => r.data)
export const updateAdminUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data)
export const deleteAdminUser = id => api.delete(`/admin/users/${id}`).then(r => r.data)

export default api