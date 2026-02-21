import axios from 'axios'

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
    if (err.response?.status === 401) { removeToken(); window.location.reload() }
    return Promise.reject(err)
  }
)

export const register    = d => api.post('/auth/register', d).then(r => r.data)
export const login       = d => api.post('/auth/login', d).then(r => r.data)
export const googleAuth  = d => api.post('/auth/google', d).then(r => r.data)
export const getMe       = () => api.get('/auth/me').then(r => r.data)

export const getProfile    = () => api.get('/profile').then(r => r.data)
export const upsertProfile = d => api.post('/profile', d).then(r => r.data)

export const getNutritionDay = day => api.get(`/nutrition/${day}`).then(r => r.data)
export const addMeal         = d   => api.post('/nutrition/meal', d).then(r => r.data)
export const deleteMeal      = id  => api.delete(`/nutrition/meal/${id}`)
export const logWater        = d   => api.post('/nutrition/water', d).then(r => r.data)

export const getWorkouts   = p   => api.get('/workouts', { params: p }).then(r => r.data)
export const createWorkout = d   => api.post('/workouts', d).then(r => r.data)
export const addExercise   = (wid, d) => api.post(`/workouts/${wid}/exercises`, d).then(r => r.data)
export const deleteWorkout = id  => api.delete(`/workouts/${id}`)

export const getStats = (days = 30) => api.get('/stats', { params: { days } }).then(r => r.data)
