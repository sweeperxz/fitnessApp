import React from 'react'

export default function AdminStateView({ loading, error, loadingLabel }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)' }}>{loadingLabel}</div>
  }

  if (!error) return null

  return (
    <div style={{ padding: 20, color: 'var(--red)', background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 10 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div style={{ fontWeight: 'bold' }}>{error}</div>
    </div>
  )
}
