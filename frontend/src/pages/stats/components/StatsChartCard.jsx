import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import StatsTooltip from './StatsTooltip'

export default function StatsChartCard({ charts, chart, onChartChange, activeChart, chartData, hasData, t }) {
  return (
    <>
      <div className="stats-chart-picker">
        {charts.map(c => (
          <button
            key={c.key}
            type="button"
            className={`stats-chart-chip${chart === c.key ? ' is-active' : ''}`}
            onClick={() => onChartChange(c.key)}
            style={chart === c.key
              ? {
                borderColor: c.color,
                background: `${c.color}15`,
                color: c.color,
              }
              : undefined}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ '--i': 4 }}>
        {!hasData ? (
          <div className="stats-chart-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div className="stats-chart-empty-text">{t('stats.no_data')}</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            {activeChart.key === 'workout' ? (
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--bg3)' }} content={<StatsTooltip unit={activeChart.unit} />} />
                <Bar dataKey="val" fill={activeChart.color} radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color-${activeChart.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeChart.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={activeChart.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<StatsTooltip unit={activeChart.unit} />} />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={activeChart.color}
                  strokeWidth={3}
                  fill={`url(#color-${activeChart.key})`}
                  dot={{ fill: activeChart.color, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0, stroke: 'var(--bg)' }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}
