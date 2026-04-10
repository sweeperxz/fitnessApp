import React from 'react'

export default function WaterCard({ waterMl, waterGoal, waterPct, onAddWater, t }) {
  return (
    <div className="card today-card" style={{ '--i': 1 }}>
      <div className="card-label">{t('today.water')}</div>

      <div className="today-water-main">
        <span className="today-water-value">{waterMl}</span>
        <span className="today-water-goal">/ {waterGoal} {t('today.ml')}</span>
      </div>

      <div className="water-track">
        <div className="water-fill" style={{ '--fill-w': `${waterPct}%` }} />
      </div>

      <div className="water-btns">
        {[100, 200, 250, 500].map(ml => (
          <button key={ml} className="water-btn" onClick={() => onAddWater(ml)}>
            +{ml}
          </button>
        ))}
      </div>
    </div>
  )
}
