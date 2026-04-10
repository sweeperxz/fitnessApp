import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getStats, getProfile } from '../api'
import './stats/StatsPage.css'
import StatsPeriodPicker from './stats/components/StatsPeriodPicker'
import StatsTopCards from './stats/components/StatsTopCards'
import StatsAveragesCard from './stats/components/StatsAveragesCard'
import StatsChartCard from './stats/components/StatsChartCard'
import StatsStreakCard from './stats/components/StatsStreakCard'

const PERIODS = [{ l: '7', d: 7 }, { l: '14', d: 14 }, { l: '30', d: 30 }]

export default function StatsPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState(7)
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [chart, setChart] = useState('calories')
  const [loading, setLoading] = useState(false)

  const caloriesUnit = t('today.calories').toLowerCase().includes('кал') ? 'ккал' : 'kcal'
  const gramsUnit = t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'
  const litersUnit = t('today.ml')[0].toLowerCase() === 'м' ? 'л' : 'L'

  const charts = useMemo(() => [
    { key: 'calories', label: t('stats.charts.calories'), color: '#FF7A00', unit: caloriesUnit },
    { key: 'protein', label: t('stats.charts.protein'), color: '#8B5CF6', unit: gramsUnit },
    { key: 'water', label: t('stats.charts.water'), color: '#0EA5E9', unit: t('today.ml') },
    { key: 'workout', label: t('stats.charts.workout'), color: '#10B981', unit: '' },
  ], [caloriesUnit, gramsUnit, t])

  useEffect(() => {
    setLoading(true)
    Promise.all([getStats(period), getProfile().catch(() => null)])
      .then(([s, p]) => {
        setStats(s)
        setProfile(p)
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [period])

  const days = stats?.days || []

  const activeDays = useMemo(() => days.filter(d => d.calories > 0), [days])
  const activeCount = activeDays.length

  const hitRate = period > 0 ? Math.round((activeCount / period) * 100) : 0
  const hitColor = hitRate >= 70 ? 'var(--accent3)' : hitRate >= 40 ? 'var(--yellow)' : 'var(--red)'
  const hitTip = hitRate >= 70 ? t('stats.hit_tips.great') : hitRate >= 40 ? t('stats.hit_tips.good') : t('stats.hit_tips.start')

  const avgCal = activeCount ? Math.round(activeDays.reduce((a, d) => a + d.calories, 0) / activeCount) : 0
  const avgPro = activeCount ? Math.round(activeDays.reduce((a, d) => a + d.protein, 0) / activeCount) : 0
  const avgWat = activeCount ? Math.round(activeDays.reduce((a, d) => a + d.water_ml, 0) / activeCount) : 0
  const totalWorkouts = days.reduce((a, d) => a + d.workout_count, 0)

  const fmt = (dateStr) => {
    const d = dayjs(dateStr)
    if (period <= 7) return d.format('dd')
    if (period <= 14) return d.format('D.MM')
    return d.format('D')
  }

  const chartData = useMemo(() => days.map(d => {
    let val = 0
    if (chart === 'calories') val = d.calories
    if (chart === 'protein') val = d.protein
    if (chart === 'water') val = d.water_ml
    if (chart === 'workout') val = d.workout_count

    return {
      day: fmt(d.day),
      val: Math.round(val),
    }
  }), [chart, days, period])

  const activeChart = charts.find(c => c.key === chart)
  const hasData = chartData.some(d => d.val > 0)

  const averages = useMemo(() => [
    { key: 'calories', value: avgCal, label: caloriesUnit },
    { key: 'protein', value: `${avgPro}${gramsUnit}`, label: t('today.protein').slice(0, 5) },
    { key: 'water', value: `${Math.round(avgWat / 100) / 10}${litersUnit}`, label: t('today.water').slice(0, 5) },
    { key: 'workout', value: totalWorkouts, label: t('stats.charts.workout').slice(0, 5) },
  ], [avgCal, avgPro, avgWat, caloriesUnit, gramsUnit, litersUnit, t, totalWorkouts])

  const streak = stats?.streak || 0
  const streakTip = streak >= 7 ? t('stats.streak_tips.great') : streak >= 3 ? t('stats.streak_tips.good') : t('stats.streak_tips.start')

  return (
    <>
      <div className="page-header">
        <div className="page-title">{t('stats.title').slice(0, 4)}<span>{t('stats.title').slice(4)}</span></div>
      </div>

      <StatsPeriodPicker
        periods={PERIODS}
        period={period}
        onChange={setPeriod}
        t={t}
      />

      {loading ? (
        <div className="stats-loading-wrap">
          <div className="stats-loading-spinner" />
        </div>
      ) : (
        <>
          <StatsTopCards
            activeCount={activeCount}
            period={period}
            days={days}
            hitRate={hitRate}
            hitColor={hitColor}
            hitTip={hitTip}
            t={t}
          />

          <StatsAveragesCard
            items={averages}
            t={t}
          />

          <StatsChartCard
            charts={charts}
            chart={chart}
            onChartChange={setChart}
            activeChart={activeChart}
            chartData={chartData}
            hasData={hasData}
            t={t}
          />

          <StatsStreakCard
            streak={streak}
            tip={streakTip}
            t={t}
          />
        </>
      )}
    </>
  )
}
