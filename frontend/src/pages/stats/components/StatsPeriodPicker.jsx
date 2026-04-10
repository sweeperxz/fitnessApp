import React from 'react'

export default function StatsPeriodPicker({ periods, period, onChange, t }) {
  return (
    <div className="stats-period-picker">
      {periods.map(p => (
        <button
          key={p.d}
          type="button"
          className={`stats-period-btn${period === p.d ? ' is-active' : ''}`}
          onClick={() => onChange(p.d)}
        >
          {t(`stats.periods.${p.d}`)}
        </button>
      ))}
    </div>
  )
}
