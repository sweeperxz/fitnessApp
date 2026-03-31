import api from '../api'

export const getAdminUsers = () => api.get('/admin/users').then(r => r.data)
export const updateAdminUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data)
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data)

const AdminService = {
  getAdminUsers,
  updateAdminUserRole,
  deleteAdminUser
}

export default AdminService
