import React from 'react'

const BADGE_COLORS = {
  calories: 'var(--amber)',
  protein: 'var(--purple)',
  water: 'var(--blue2)',
  workout: 'var(--green)',
}

const BADGE_BG = {
  calories: 'rgba(245, 158, 11, 0.08)',
  protein: 'rgba(139, 92, 246, 0.08)',
  water: 'rgba(59, 130, 246, 0.08)',
  workout: 'rgba(16, 185, 129, 0.08)',
}

export default function StatsAveragesCard({ items, t }) {
  return (
    <div
      className="card"
      style={{
        '--i': 3,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px',
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="card-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        {t('stats.avg_stats')}
      </div>

      <div className="stats-avg-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {items.map(item => (
          <div
            key={item.key}
            className="stats-avg-item"
            style={{
              textAlign: 'center',
              padding: '10px 4px',
              background: BADGE_BG[item.key] || 'var(--bg3)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div className="stats-avg-value" style={{ fontSize: 15, fontWeight: 900, color: BADGE_COLORS[item.key] || 'var(--text)' }}>
              {item.value}
            </div>
            <div
              className="stats-avg-label"
              style={{
                fontSize: 9,
                color: 'var(--text3)',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 700,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
