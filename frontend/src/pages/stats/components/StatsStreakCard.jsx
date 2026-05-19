import React from 'react'

export default function StatsStreakCard({ streak, tip, t }) {
  return (
    <div
      className="card"
      style={{
        '--i': 5,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px 20px',
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="card-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        {t('stats.streak')}
      </div>

      <div className="stats-streak-wrap" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Анимированное оранжевое пламя */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          color: 'var(--amber)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <div className="stats-streak-title" style={{ fontSize: 15, fontWeight: 850, color: 'var(--text)' }}>
            {streak} {t('stats.days_streak')}
          </div>
          <div className="stats-streak-tip" style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, fontWeight: 600, lineHeight: 1.4 }}>
            {tip}
          </div>
        </div>
      </div>
    </div>
  )
}
