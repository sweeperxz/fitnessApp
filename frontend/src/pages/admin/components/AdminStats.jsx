import React from 'react'

export default function AdminStats({ totalUsers, totalAdmins, totalUsersLabel, totalAdminsLabel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
      <div style={{ background: 'var(--bg2)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 800 }}>{totalUsersLabel}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{totalUsers}</div>
      </div>
      <div style={{ background: 'var(--bg2)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 800 }}>{totalAdminsLabel}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{totalAdmins}</div>
      </div>
    </div>
  )
}
