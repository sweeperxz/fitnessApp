import React from 'react'

export default function StatsTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null

  return (
    <div className="stats-tooltip">
      <div className="stats-tooltip-label">{label}</div>
      <div className="stats-tooltip-value" style={{ color: payload[0]?.color }}>
        {Math.round(payload[0]?.value || 0)}{unit}
      </div>
    </div>
  )
}
