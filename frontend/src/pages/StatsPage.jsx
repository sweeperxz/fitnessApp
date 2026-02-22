import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import dayjs from 'dayjs'
import { getStats, getProfile } from '../api'

const PERIODS = [{ l: '7 дней', d: 7 }, { l: '14 дней', d: 14 }, { l: '30 дней', d: 30 }]

// 1. Юзер-френдли цвета (HEX), которые не сломают SVG-градиент
const CHARTS = [
  { key: 'calories', label: 'Калории', dataKey: 'ккал', color: '#FF7A00', unit: 'ккал' }, // Энергичный оранжевый
  { key: 'protein', label: 'Белки', dataKey: 'г белка', color: '#8B5CF6', unit: 'г' },    // Насыщенный фиолетовый
  { key: 'water', label: 'Вода', dataKey: 'мл', color: '#0EA5E9', unit: 'мл' },   // Чистый голубой
  { key: 'workout', label: 'Тренировки', dataKey: 'шт', color: '#10B981', unit: '' },     // Активный изумрудный
]

const Tip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ color: 'var(--text2)', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: payload[0]?.color, fontWeight: 800, fontSize: 14 }}>{Math.round(payload[0]?.value)}{unit}</div>
    </div>
  )
}

export default function StatsPage() {
  const [period, setPeriod] = useState(7)
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [chart, setChart] = useState('calories')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getStats(period), getProfile().catch(() => null)])
      .then(([s, p]) => { setStats(s); setProfile(p) })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [period])

  const days = stats?.days || []
  const active = days.filter(d => d.calories > 0)
  const hitRate = period > 0 ? Math.round(active.length / period * 100) : 0
  const hitColor = hitRate >= 70 ? 'var(--accent3)' : hitRate >= 40 ? 'var(--yellow)' : 'var(--red)'
  const avgCal = active.length ? Math.round(active.reduce((a, d) => a + d.calories, 0) / active.length) : 0
  const avgPro = active.length ? Math.round(active.reduce((a, d) => a + d.protein, 0) / active.length) : 0
  const avgWat = active.length ? Math.round(active.reduce((a, d) => a + d.water_ml, 0) / active.length) : 0
  const totWrk = days.reduce((a, d) => a + d.workout_count, 0)

  const fmt = (dateStr) => {
    const d = dayjs(dateStr)
    if (period <= 7) return d.format('dd')
    if (period <= 14) return d.format('D.MM')
    return d.format('D')
  }

  const chartData = days.map(d => ({
    day: fmt(d.day), full: dayjs(d.day).format('D MMM'),
    'ккал': Math.round(d.calories), 'г белка': Math.round(d.protein),
    'мл': d.water_ml, 'шт': d.workout_count,
  }))

  const ac = CHARTS.find(c => c.key === chart)
  const hasData = chartData.some(d => d[ac.dataKey] > 0)

  return (
    <>
      <div className="page-header">
        <div className="page-title">Про<span>гресс</span></div>
      </div>

      {/* Period picker */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {PERIODS.map(p => (
          <button key={p.d} onClick={() => setPeriod(p.d)} style={{
            flex: 1, padding: '11px 0', borderRadius: 'var(--r-sm)',
            border: `1.5px solid ${period === p.d ? 'var(--blue)' : 'transparent'}`,
            background: period === p.d ? 'rgba(37,99,235,0.15)' : 'var(--bg3)',
            color: period === p.d ? 'var(--blue)' : 'var(--text3)',
            fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: period === p.d ? '0 0 0 1px rgba(37,99,235,0.2)' : 'none',
            transition: 'all 0.2s'
          }}>{p.l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div style={{ width: 32, height: 32, border: '2.5px solid var(--bg3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : <>
        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-label">Активных дней</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{active.length}<span style={{ fontSize: 16, color: 'var(--text2)', fontWeight: 500 }}>/{period}</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 10 }}>
              {days.map((d, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: d.calories > 0 ? 'var(--accent)' : 'var(--bg4)', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-label">Попадание в цель</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: hitColor, lineHeight: 1 }}>{hitRate}<span style={{ fontSize: 18 }}>%</span></div>
            <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: hitRate + '%', background: hitColor, borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 6, lineHeight: 1.4 }}>
              {hitRate >= 70 ? 'Отличная дисциплина' : hitRate >= 40 ? 'Есть куда расти' : 'Старайся каждый день'}
            </div>
          </div>
        </div>

        {/* Avg row */}
        <div className="card">
          <div className="card-label">Средние показатели</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[{ v: avgCal, l: 'ккал' }, { v: avgPro + 'г', l: 'белки' }, { v: Math.round(avgWat / 100) / 10 + 'л', l: 'вода' }, { v: totWrk, l: 'трени' }].map(s => (
              <div key={s.l} style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CHARTS.map(c => (
            <button key={c.key} onClick={() => setChart(c.key)} style={{
              padding: '7px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              border: `1px solid ${chart === c.key ? c.color : 'var(--border)'}`,
              background: chart === c.key ? `${c.color}15` : 'var(--bg2)', // Слегка подкрашиваем фон активной кнопки
              color: chart === c.key ? c.color : 'var(--text2)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'all 0.2s'
            }}>{c.label}</button>
          ))}
        </div>

        {/* Chart */}
        <div className="card">
          {!hasData ? (
            <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Нет данных за этот период</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              {ac.key === 'workout' ? (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--bg3)' }} content={<Tip unit={ac.unit} />} />
                  <Bar dataKey={ac.dataKey} fill={ac.color} radius={[6, 6, 0, 0]} maxBarSize={24} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    {/* 2. Уникальный ID градиента предотвращает баг "залипания" цвета */}
                    <linearGradient id={`color-${ac.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ac.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={ac.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip unit={ac.unit} />} />
                  <Area type="monotone" dataKey={ac.dataKey} stroke={ac.color} strokeWidth={3}
                    fill={`url(#color-${ac.key})`} dot={{ fill: ac.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0, stroke: 'var(--bg)' }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Streak */}
        <div className="card">
          <div className="card-label">Серия</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{stats?.streak || 0}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>дней подряд</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.4 }}>
                {(stats?.streak || 0) >= 7 ? 'Превосходный результат' : (stats?.streak || 0) >= 3 ? 'Продолжай в том же духе' : 'Начни серию сегодня'}
              </div>
            </div>
          </div>
        </div>
      </>}
    </>
  )
}