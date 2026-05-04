import axios from 'axios'
import { enqueue, setupAutoFlush } from '../utils/offlineSync'
import { errorHaptic } from '../utils/haptic'
import { clearApiResponseCache } from '../utils/swCache'
import { clearOfflineData } from '../utils/offlineStorage'

const api = axios.create({ baseURL: '/api' })

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 секунда

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Событие для AuthContext: токен оказался недействителен (401) или юзер
// явно вышел. Слушатель чистит React-стейт и редиректит на /auth через
// React Router — без `window.location.reload()`, который раньше убивал
// весь in-flight UI-стейт и ломался на оффлайн-мокнутых 401.
export const AUTH_EXPIRED_EVENT = 'nutrio:auth-expired'

export const getToken = () => localStorage.getItem('ff_token')
export const setToken = (t) => localStorage.setItem('ff_token', t)
export const removeToken = () => localStorage.removeItem('ff_token')
export const clearAuthState = () => {
  removeToken()
  // Списываем легаси-ключ от старого CSRF-механизма, если он остался в браузере.
  localStorage.removeItem('ff_csrf_token')
  // SW-кеш с приватными API-ответами + локальный read-cache: всё это
  // принадлежит конкретному юзеру; на logout вычищаем, чтобы в shared-
  // браузере следующий юзер не увидел чужие данные в оффлайне.
  // `clearApiResponseCache` async — fire-and-forget, не блокируем UI.
  clearApiResponseCache()
  clearOfflineData()
}

api.interceptors.request.use(cfg => {
  cfg.headers = cfg.headers || {}

  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`

  if (!cfg.retryCount) cfg.retryCount = 0

  return cfg
})

api.interceptors.response.use(
  r => r,
  async err => {
    const config = err.config

    // Auth error — soft-logout. Раньше тут был `window.location.reload()`,
    // что убивало любой in-flight UI-стейт (модалки, формы, скролл) и
    // зацикливалось, если SW отдавал устаревший/мокнутый 401 из кеша.
    // Теперь стреляем событие — AuthContext снимает юзера, гварды на
    // React Router редиректят на /auth без full reload.
    if (err.response?.status === 401) {
      clearAuthState()
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
      return Promise.reject(err)
    }

    // Retry logic для network errors та 5xx помилок
    const shouldRetry = (
      !err.response || // Network error
      (err.response.status >= 500 && err.response.status < 600) // Server error
    ) && config && config.retryCount < MAX_RETRIES

    if (shouldRetry) {
      config.retryCount += 1
      console.log(`Retry attempt ${config.retryCount}/${MAX_RETRIES} for ${config.url}`)

      // Exponential backoff
      await sleep(RETRY_DELAY * config.retryCount)

      return api(config)
    }

    // Network error on write request → save to offline queue
    if (!err.response && config) {
      const method = config.method
      if ((method === 'post' || method === 'put' || method === 'delete') && !config.skipOfflineQueue) {
        errorHaptic()
        enqueue(method, config.url, config.data ? JSON.parse(config.data) : null)
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

export const searchFoods = (q, limit = 8) => api.get('/foods/search', { params: { q, limit } }).then(r => r.data)
export const findFoodByBarcode = barcode => api.get(`/foods/barcode/${barcode}`).then(r => r.data)
export const getRecentFoods = () => api.get('/foods/recent').then(r => r.data)
export const addRecentFood = d => api.post('/foods/recent', d).then(r => r.data)

// `{ items, total, skip, limit }` — фронт пагинируется по total. Раньше
// отдавал просто массив, и AdminPage обрезал список после 50-го юзера.
export const getAdminUsers = ({ skip = 0, limit = 50 } = {}) =>
  api.get('/admin/users', { params: { skip, limit } }).then(r => r.data)
export const updateAdminUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data)
export const deleteAdminUser = id => api.delete(`/admin/users/${id}`).then(r => r.data)

export default api