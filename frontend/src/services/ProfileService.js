import api from '../api'

export const getProfile = () => api.get('/profile').then(r => r.data)
export const upsertProfile = (data) => api.post('/profile', data).then(r => r.data)
export const getStats = (days = 30) => api.get('/stats', { params: { days } }).then(r => r.data)

const ProfileService = {
  getProfile,
  upsertProfile,
  getStats
}

export default ProfileService
