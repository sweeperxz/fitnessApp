import React from 'react'

export default function WaterCard({ waterMl, waterGoal, waterPct, onAddWater, t }) {
  return (
    <div className="card today-card" style={{ '--i': 1, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="card-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          {t('today.water')}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{waterMl}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 650 }}>/ {waterGoal} {t('today.ml')}</span>
        </div>
      </div>

      {/* Шкала воды с градиентной заливкой */}
      <div style={{ height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
        <div
          style={{
            width: `${waterPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            borderRadius: 4,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)',
          }}
        />
      </div>

      {/* Капсульные кнопки быстрого добавления */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[100, 200, 250, 500].map(ml => (
          <button
            key={ml}
            onClick={() => onAddWater(ml)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg3)',
              color: 'var(--text2)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="water-capsule-btn"
          >
            +{ml}
          </button>
        ))}
      </div>
    </div>
  )
}
