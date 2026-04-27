import React from 'react'
import dayjs from 'dayjs'

export default function AdminUserCard({ user, myId, actionLoading, t, onToggleRole, onDelete }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', wordBreak: 'break-all' }}>{user.email}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
            {user.name ? `${t('profile.user')}: ${user.name}` : <span style={{ opacity: 0.5 }}>{t('admin.user_card.no_name')}</span>}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            padding: '4px 10px',
            borderRadius: 16,
            background: user.role === 'admin' ? 'var(--blue)' : 'var(--bg4)',
            color: user.role === 'admin' ? '#fff' : 'var(--text2)',
            textTransform: 'uppercase',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {user.role}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>
        {t('admin.user_card.registered')}: {dayjs(user.created_at).format('DD.MM.YYYY HH:mm')}
      </div>

      {user.id !== myId && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onToggleRole(user)}
            disabled={actionLoading}
            style={{
              flex: 1,
              padding: '8px 0',
              border: '1px solid var(--border)',
              background: 'var(--bg3)',
              borderRadius: 10,
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 700,
              opacity: actionLoading ? 0.5 : 1,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {user.role === 'admin' ? t('admin.user_card.remove_admin') : t('admin.user_card.make_admin')}
          </button>

          <button
            onClick={() => onDelete(user)}
            disabled={actionLoading}
            style={{
              width: 40,
              padding: 0,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)',
              borderRadius: 10,
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: actionLoading ? 0.5 : 1,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      )}

      {user.id === myId && (
        <div style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', padding: 8, borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
          {t('admin.user_card.is_you')}
        </div>
      )}
    </div>
  )
}
