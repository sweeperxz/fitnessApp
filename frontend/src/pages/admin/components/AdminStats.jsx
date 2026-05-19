import React from 'react'

export default function AdminStats({ totalUsers, totalAdmins, totalUsersLabel, totalAdminsLabel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
      {/* Все пользователи */}
      <div style={{
        background: 'var(--bg2)',
        padding: '16px',
        borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
          {totalUsersLabel}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>
          {totalUsers}
        </div>
      </div>

      {/* Администраторы */}
      <div style={{
        background: 'var(--bg2)',
        padding: '16px',
        borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
          {totalAdminsLabel}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--blue2)' }}>
          {totalAdmins}
        </div>
      </div>
    </div>
  )
}
