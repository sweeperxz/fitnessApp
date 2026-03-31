import api from '../api'

export const login = (data) => api.post('/auth/login', data).then(r => r.data)
export const register = (data) => api.post('/auth/register', data).then(r => r.data)
export const googleAuth = (data) => api.post('/auth/google', data).then(r => r.data)
export const getMe = () => api.get('/auth/me').then(r => r.data)

const AuthService = {
  login,
  register,
  googleAuth,
  getMe
}

export default AuthService
