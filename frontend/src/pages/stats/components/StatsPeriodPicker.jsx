import React from 'react'

export default function StatsPeriodPicker({ periods, period, onChange, t }) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '3px',
        marginBottom: 16,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
      }}
      className="stats-period-picker-container"
    >
      {periods.map(p => {
        const isActive = period === p.d
        return (
          <button
            key={p.d}
            type="button"
            onClick={() => onChange(p.d)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 16,
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              background: isActive ? 'var(--bg3)' : 'none',
              color: isActive ? 'var(--text)' : 'var(--text3)',
              fontFamily: 'var(--font)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.03)' : 'none',
            }}
          >
            {t(`stats.periods.${p.d}`)}
          </button>
        )
      })}
    </div>
  )
}
