import React from 'react'

export default function StatsTopCards({ activeCount, period, days, hitRate, hitColor, hitTip, t }) {
  return (
    <div className="stat-grid stats-top-grid">
      <div className="card stats-top-card" style={{ '--i': 1 }}>
        <div className="card-label">{t('stats.active_days')}</div>
        <div className="stats-top-value">
          {activeCount}
          <span>/{period}</span>
        </div>

        <div className="stats-active-dots">
          {days.map((d, i) => (
            <div
              key={`${d.day || i}-${i}`}
              className="stats-active-dot"
              style={{ background: d.calories > 0 ? 'var(--blue)' : 'var(--bg4)' }}
            />
          ))}
        </div>
      </div>

      <div className="card stats-top-card" style={{ '--i': 2 }}>
        <div className="card-label">{t('stats.hit_rate')}</div>
        <div className="stats-top-value" style={{ color: hitColor }}>
          {hitRate}
          <span>%</span>
        </div>

        <div className="stats-hit-track">
          <div className="stats-hit-fill" style={{ width: `${hitRate}%`, background: hitColor }} />
        </div>

        <div className="stats-hit-tip">{hitTip}</div>
      </div>
    </div>
  )
}
