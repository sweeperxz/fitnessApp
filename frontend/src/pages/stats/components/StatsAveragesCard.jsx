import React from 'react'

export default function StatsAveragesCard({ items, t }) {
  return (
    <div className="card" style={{ '--i': 3 }}>
      <div className="card-label">{t('stats.avg_stats')}</div>

      <div className="stats-avg-grid">
        {items.map(item => (
          <div key={item.key} className="stats-avg-item">
            <div className="stats-avg-value">{item.value}</div>
            <div className="stats-avg-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
