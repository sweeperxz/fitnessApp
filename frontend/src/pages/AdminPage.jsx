import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminUsers, updateAdminUserRole, deleteAdminUser } from '../api'
import { useAuthContext } from '../auth/AuthContext'
import { mediumHaptic, successHaptic, errorHaptic } from '../utils/haptic'
import AdminHeader from './admin/components/AdminHeader'
import AdminStateView from './admin/components/AdminStateView'
import AdminStats from './admin/components/AdminStats'
import AdminUserCard from './admin/components/AdminUserCard'

export default function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  // user_id уже есть в AuthContext — не делаем лишний getMe() round-trip.
  const myId = user?.user_id ?? null
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      const allUsers = await getAdminUsers()
      setUsers(allUsers)
      setError('')
    } catch (err) {
      if (err.response?.status === 403) {
        setError(t('admin.errors.forbidden'))
      } else {
        setError(t('admin.errors.load_fail'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleRole = async user => {
    mediumHaptic()
    if (actionLoading) return
    if (user.id === myId) {
      errorHaptic()
      alert(t('admin.errors.self_role'))
      return
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (!window.confirm(t('admin.user_card.confirm_role', { email: user.email, role: newRole.toUpperCase() }))) return

    setActionLoading(true)
    try {
      await updateAdminUserRole(user.id, newRole)
      successHaptic()
      await loadData()
    } catch (err) {
      errorHaptic()
      alert(err.response?.data?.detail || t('admin.errors.action_fail'))
    }
    setActionLoading(false)
  }

  const handleDelete = async user => {
    errorHaptic()
    if (actionLoading) return
    if (user.id === myId) {
      alert(t('admin.errors.self_del'))
      return
    }

    const confirmText = prompt(`${t('admin.user_card.confirm_del')}\n${user.email}`)
    if (confirmText !== user.email) {
      if (confirmText !== null) alert(t('admin.user_card.del_error_email'))
      return
    }

    setActionLoading(true)
    try {
      await deleteAdminUser(user.id)
      successHaptic()
      await loadData()
    } catch (err) {
      errorHaptic()
      alert(err.response?.data?.detail || t('admin.errors.action_fail'))
    }
    setActionLoading(false)
  }

  const totalUsers = users.length
  const totalAdmins = users.filter(user => user.role === 'admin').length

  return (
    <>
      <AdminHeader title={t('admin.title')} />

      <div className="fade-in">
        <AdminStateView loading={loading} error={error} loadingLabel={t('common.loading')} />

        {!loading && !error && (
          <div>
            <AdminStats
              totalUsers={totalUsers}
              totalAdmins={totalAdmins}
              totalUsersLabel={t('admin.stats.all')}
              totalAdminsLabel={t('admin.stats.admins')}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 60 }}>
              {users.map(user => (
                <AdminUserCard
                  key={user.id}
                  user={user}
                  myId={myId}
                  actionLoading={actionLoading}
                  t={t}
                  onToggleRole={handleToggleRole}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
