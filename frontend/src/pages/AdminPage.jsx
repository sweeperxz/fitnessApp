import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminUsers, updateAdminUserRole, deleteAdminUser } from '../api'
import { useAuthContext } from '../auth/AuthContext'
import { mediumHaptic, successHaptic, errorHaptic } from '../utils/haptic'
import AdminHeader from './admin/components/AdminHeader'
import AdminStateView from './admin/components/AdminStateView'
import AdminStats from './admin/components/AdminStats'
import AdminUserCard from './admin/components/AdminUserCard'
import AdminPagination from './admin/components/AdminPagination'

const PAGE_SIZE = 50

export default function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  // user_id уже есть в AuthContext — не делаем лишний getMe() round-trip.
  const myId = user?.user_id ?? null
  const [users, setUsers] = useState([])
  // Пагинация. На бэке /admin/users отдаёт `{ items, total, skip, limit }`.
  // Раньше фронт обрезал список на дефолтном limit=50 без UI «дальше»,
  // поэтому хвост юзеров был невидим.
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [adminsCount, setAdminsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async (pageIndex) => {
    try {
      const resp = await getAdminUsers({ skip: pageIndex * PAGE_SIZE, limit: PAGE_SIZE })
      setUsers(resp.items || [])
      setTotal(resp.total || 0)
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
  }, [t])

  useEffect(() => {
    loadData(page)
  }, [page, loadData])

  // adminsCount по текущей странице может быть нерепрезентативен, если
  // юзеров > PAGE_SIZE; делаем отдельный лёгкий запрос с large-limit на
  // /admin/users чисто для счётчика. Раньше число админов считалось по
  // обрезанному списку и врало после 50-го юзера.
  useEffect(() => {
    let cancelled = false
    getAdminUsers({ skip: 0, limit: 100 })
      .then((resp) => {
        if (cancelled) return
        const all = resp.items || []
        // Если юзеров больше 100 — мы всё равно увидим хотя бы первую сотню;
        // дальнейшая точность не критична для бейджа в шапке.
        setAdminsCount(all.filter((u) => u.role === 'admin').length)
      })
      .catch(() => {
        // тихо: главный loadData уже обработает 403/load_fail
      })
    return () => {
      cancelled = true
    }
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
      await loadData(page)
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
      // После удаления текущая страница могла стать пустой (удалили
      // последний элемент с последней страницы) — откатываемся на одну
      // назад, иначе UI показывал бы «empty page» без подсказки.
      const remaining = total - 1
      const lastPage = Math.max(0, Math.ceil(remaining / PAGE_SIZE) - 1)
      const nextPage = Math.min(page, lastPage)
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await loadData(nextPage)
      }
    } catch (err) {
      errorHaptic()
      alert(err.response?.data?.detail || t('admin.errors.action_fail'))
    }
    setActionLoading(false)
  }

  return (
    <>
      <AdminHeader title={t('admin.title')} />

      <div className="fade-in">
        <AdminStateView loading={loading} error={error} loadingLabel={t('common.loading')} />

        {!loading && !error && (
          <div>
            <AdminStats
              totalUsers={total}
              totalAdmins={adminsCount}
              totalUsersLabel={t('admin.stats.all')}
              totalAdminsLabel={t('admin.stats.admins')}
            />

            <AdminPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              busy={actionLoading}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              prevLabel={t('admin.pagination.prev')}
              nextLabel={t('admin.pagination.next')}
              rangeLabel={t('admin.pagination.range')}
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
