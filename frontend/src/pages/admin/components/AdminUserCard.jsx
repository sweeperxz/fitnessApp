import React from 'react'
import dayjs from 'dayjs'

export default function AdminUserCard({ user, myId, actionLoading, t, onToggleRole, onDelete }) {
  const isAdmin = user.role === 'admin'

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px 20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', wordBreak: 'break-all' }}>
            {user.email}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>
            {user.name ? `${t('profile.user')}: ${user.name}` : <span style={{ opacity: 0.5 }}>{t('admin.user_card.no_name')}</span>}
          </div>
        </div>
        
        {/* Ролевой бейдж */}
        <div
          style={{
            fontSize: 10,
            padding: '4px 12px',
            borderRadius: 20,
            background: isAdmin ? 'var(--blue-glow)' : 'var(--bg3)',
            color: isAdmin ? 'var(--blue2)' : 'var(--text2)',
            border: isAdmin ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid var(--border)',
            textTransform: 'uppercase',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {user.role}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 16 }}>
        {t('admin.user_card.registered')}: {dayjs(user.created_at).format('DD.MM.YYYY HH:mm')}
      </div>

      {user.id !== myId && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onToggleRole(user)}
            disabled={actionLoading}
            style={{
              flex: 1,
              padding: '10px 0',
              border: '1px solid var(--border)',
              background: 'var(--bg3)',
              borderRadius: 14,
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 800,
              opacity: actionLoading ? 0.5 : 1,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            className="hover-bg-target"
          >
            {isAdmin ? t('admin.user_card.remove_admin') : t('admin.user_card.make_admin')}
          </button>

          <button
            onClick={() => onDelete(user)}
            disabled={actionLoading}
            style={{
              width: 44,
              padding: 0,
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.06)',
              borderRadius: 14,
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: actionLoading ? 0.5 : 1,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      )}

      {user.id === myId && (
        <div style={{
          background: 'var(--blue-glow)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          color: 'var(--blue2)',
          padding: '8px 12px',
          borderRadius: 14,
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {t('admin.user_card.is_you')}
        </div>
      )}
    </div>
  )
}
