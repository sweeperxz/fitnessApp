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
      
      // For GET requests or others without a response
      err.isOffline = true
    }

    // Capture standard offline from service worker mock responses if needed
    if (err.response?.data?.error === 'offline') {
      err.isOffline = true
    }

    errorHaptic()
    return Promise.reject(err)
  }
)

// Auto-sync queued requests when back online
setupAutoFlush(api, (result) => {
  window.dispatchEvent(new CustomEvent('nutrio:synced', { detail: result }))
})

export default api

export * from '../services/AuthService'
export * from '../services/ProfileService'
export * from '../services/AdminService'
export * from '../services/WorkoutService'
export * from '../services/NutritionService'
export * from '../services/AiService'