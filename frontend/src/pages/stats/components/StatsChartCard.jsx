import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import StatsTooltip from './StatsTooltip'

export default function StatsChartCard({ charts, chart, onChartChange, activeChart, chartData, hasData, t }) {
  return (
    <>
      {/* Горизонтальный скролл чипсов графиков */}
      <div
        className="stats-chart-picker"
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 14,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 4,
        }}
      >
        {charts.map(c => {
          const isActive = chart === c.key
          return (
            <button
              key={c.key}
              type="button"
              className={`stats-chart-chip${isActive ? ' is-active' : ''}`}
              onClick={() => onChartChange(c.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                border: `1px solid ${isActive ? c.color : 'var(--border)'}`,
                background: isActive ? `${c.color}12` : 'var(--bg2)',
                color: isActive ? c.color : 'var(--text2)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 2px 8px ${c.color}15` : 'none',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Карточка графика */}
      <div
        className="card"
        style={{
          '--i': 4,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '18px 16px',
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {!hasData ? (
          <div className="stats-chart-empty" style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div className="stats-chart-empty-text" style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>
              {t('stats.no_data')}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            {activeChart.key === 'workout' ? (
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10, fontWeight: 600 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--bg3)' }} content={<StatsTooltip unit={activeChart.unit} />} />
                <Bar dataKey="val" fill={activeChart.color} radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color-${activeChart.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeChart.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={activeChart.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<StatsTooltip unit={activeChart.unit} />} />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={activeChart.color}
                  strokeWidth={2.8}
                  fill={`url(#color-${activeChart.key})`}
                  dot={{ fill: activeChart.color, r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 5.5, strokeWidth: 2, stroke: 'var(--bg2)' }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}
