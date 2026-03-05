import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminUsers, updateAdminUserRole, deleteAdminUser, getMe } from '../api'
import dayjs from 'dayjs'
import { tapHaptic, mediumHaptic, successHaptic, errorHaptic } from '../utils/haptic'

export default function AdminPage() {
    const { t } = useTranslation()
    const [users, setUsers] = useState([])
    const [myId, setMyId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')

    const loadData = async () => {
        try {
            const [me, allUsers] = await Promise.all([getMe(), getAdminUsers()])
            setMyId(me.user_id)
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

    const handleToggleRole = async (u) => {
        mediumHaptic()
        if (actionLoading) return
        if (u.id === myId) {
            errorHaptic()
            alert(t('admin.errors.self_role'))
            return
        }

        const newRole = u.role === 'admin' ? 'user' : 'admin'
        if (!window.confirm(t('admin.user_card.confirm_role', { email: u.email, role: newRole.toUpperCase() }))) return

        setActionLoading(true)
        try {
            await updateAdminUserRole(u.id, newRole)
            successHaptic()
            await loadData()
        } catch (err) {
            errorHaptic()
            alert(err.response?.data?.detail || t('admin.errors.action_fail'))
        }
        setActionLoading(false)
    }

    const handleDelete = async (u) => {
        errorHaptic()
        if (actionLoading) return
        if (u.id === myId) {
            alert(t('admin.errors.self_del'))
            return
        }

        const confirmText = prompt(`${t('admin.user_card.confirm_del')}\n${u.email}`)
        if (confirmText !== u.email) {
            if (confirmText !== null) alert(t('admin.user_card.del_error_email'))
            return
        }

        setActionLoading(true)
        try {
            await deleteAdminUser(u.id)
            successHaptic()
            await loadData()
        } catch (err) {
            errorHaptic()
            alert(err.response?.data?.detail || t('admin.errors.action_fail'))
        }
        setActionLoading(false)
    }

    const totalUsers = users.length
    const totalAdmins = users.filter(u => u.role === 'admin').length

    return (
        <>
            <div className="page-header">
                <div className="page-title">{t('admin.title').split('-')[0]}-<span>{t('admin.title').split('-')[1]}</span></div>
            </div>

            <div className="card fade-in">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)' }}>{t('common.loading')}</div>
                ) : error ? (
                    <div style={{ padding: 20, color: 'var(--red)', background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 10 }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div style={{ fontWeight: 'bold' }}>{error}</div>
                    </div>
                ) : (
                    <div>
                        {/* Статистика */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                            <div style={{ background: 'var(--bg2)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 800 }}>{t('admin.stats.all')}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{totalUsers}</div>
                            </div>
                            <div style={{ background: 'var(--bg2)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 800 }}>{t('admin.stats.admins')}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{totalAdmins}</div>
                            </div>
                        </div>

                        {/* Список користувачів */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 60 }}>
                            {users.map(u => (
                                <div key={u.id} style={{ padding: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16 }}>

                                    {/* Хедер юзера */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ flex: 1, paddingRight: 10 }}>
                                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', wordBreak: 'break-all' }}>{u.email}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                                                {u.name ? `${t('profile.user')}: ${u.name}` : <span style={{ opacity: 0.5 }}>{t('admin.user_card.no_name')}</span>}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: 10,
                                            padding: '4px 10px',
                                            borderRadius: 16,
                                            background: u.role === 'admin' ? 'var(--blue)' : 'var(--bg4)',
                                            color: u.role === 'admin' ? '#fff' : 'var(--text2)',
                                            textTransform: 'uppercase',
                                            fontWeight: 800,
                                            flexShrink: 0
                                        }}>
                                            {u.role}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>
                                        {t('admin.user_card.registered')}: {dayjs(u.created_at).format('DD.MM.YYYY HH:mm')}
                                    </div>

                                    {/* Action Buttons (hide for self) */}
                                    {u.id !== myId && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => handleToggleRole(u)}
                                                disabled={actionLoading}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 0',
                                                    borderRadius: 10,
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--bg3)',
                                                    color: 'var(--text)',
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                    opacity: actionLoading ? 0.5 : 1
                                                }}
                                            >
                                                {u.role === 'admin' ? t('admin.user_card.remove_admin') : t('admin.user_card.make_admin')}
                                            </button>

                                            <button
                                                onClick={() => handleDelete(u)}
                                                disabled={actionLoading}
                                                style={{
                                                    width: 40,
                                                    padding: 0,
                                                    borderRadius: 10,
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: 'var(--red)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                    opacity: actionLoading ? 0.5 : 1
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {u.id === myId && (
                                        <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, textAlign: 'center' }}>
                                            {t('admin.user_card.is_you')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
