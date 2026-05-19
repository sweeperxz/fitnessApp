import React from 'react'

export default function StatsTopCards({ activeCount, period, days, hitRate, hitColor, hitTip, t }) {
  return (
    <div className="stat-grid stats-top-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      {/* Активные дни */}
      <div
        className="card stats-top-card"
        style={{
          margin: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div className="card-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          {t('stats.active_days')}
        </div>
        <div className="stats-top-value" style={{ fontSize: 28, fontWeight: 900, color: 'var(--blue2)' }}>
          {activeCount}
          <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 700 }}>/{period}</span>
        </div>

        <div className="stats-active-dots" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
          {days.map((d, i) => (
            <div
              key={`${d.day || i}-${i}`}
              className="stats-active-dot"
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: d.calories > 0 ? 'var(--blue2)' : 'var(--bg4)',
                boxShadow: d.calories > 0 ? '0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Процент попадания */}
      <div
        className="card stats-top-card"
        style={{
          margin: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div className="card-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          {t('stats.hit_rate')}
        </div>
        <div className="stats-top-value" style={{ fontSize: 28, fontWeight: 900, color: hitColor }}>
          {hitRate}
          <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 700 }}>%</span>
        </div>

        <div className="stats-hit-track" style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
          <div
            className="stats-hit-fill"
            style={{
              height: '100%',
              width: `${hitRate}%`,
              background: hitColor,
              borderRadius: 3,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        <div className="stats-hit-tip" style={{ fontSize: 10, color: 'var(--text2)', marginTop: 8, fontWeight: 600, lineHeight: 1.3 }}>
          {hitTip}
        </div>
      </div>
    </div>
  )
}
