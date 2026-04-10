import React from 'react'

export default function StatsStreakCard({ streak, tip, t }) {
  return (
    <div className="card" style={{ '--i': 5 }}>
      <div className="card-label">{t('stats.streak')}</div>

      <div className="stats-streak-wrap">
        <div className="stats-streak-value">{streak}</div>

        <div>
          <div className="stats-streak-title">{t('stats.days_streak')}</div>
          <div className="stats-streak-tip">{tip}</div>
        </div>
      </div>
    </div>
  )
}
