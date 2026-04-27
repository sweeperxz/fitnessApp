import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getWorkouts } from '../api'
import { getWeek } from './workouts/constants'
import WorkoutsHeader from './workouts/components/WorkoutsHeader'
import WorkoutsStats from './workouts/components/WorkoutsStats'
import WorkoutsWeekPicker from './workouts/components/WorkoutsWeekPicker'
import WorkoutsEmptyState from './workouts/components/WorkoutsEmptyState'
import WorkoutCard from './workouts/components/WorkoutCard'
import WorkoutsFabPortal from './workouts/components/WorkoutsFabPortal'

export default function WorkoutsPage({ onBlockingOverlayChange }) {
  const { t } = useTranslation()
  const [week, setWeek] = useState(dayjs())
  const [day, setDay] = useState(dayjs())
  const [workouts, setWorkouts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [loadError, setLoadError] = useState(false)

  const weekDays = useMemo(() => getWeek(week), [week])

  const load = useCallback(async () => {
    try {
      setWorkouts(await getWorkouts({ from_date: weekDays[0].format('YYYY-MM-DD'), to_date: weekDays[6].format('YYYY-MM-DD') }))
      setIsOffline(false)
      setLoadError(false)
    } catch (err) {
      if (err.isOffline || !navigator.onLine) {
        setIsOffline(true)
        return
      }

      setLoadError(true)
    }
  }, [weekDays])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      load()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [load])

  useEffect(() => {
    onBlockingOverlayChange?.(modalOpen)
    return () => onBlockingOverlayChange?.(false)
  }, [modalOpen, onBlockingOverlayChange])

  const dayWorkouts = workouts.filter(w => w.day === day.format('YYYY-MM-DD'))
  const hasWorkoutForDay = d => workouts.some(w => w.day === d.format('YYYY-MM-DD'))
  const totalSets = workouts.reduce((a, w) => a + (w.exercises || []).reduce((b, e) => b + e.sets, 0), 0)
  const totalTons = workouts.reduce((a, w) => a + (w.exercises || []).reduce((b, e) => b + e.sets * e.reps * e.weight_kg / 1000, 0), 0)

  const tonnageUnit = t('today.ml')[0].toLowerCase() === 'м' ? 'т' : 't'

  return (
    <>
      <WorkoutsHeader title={t('workouts.title')} />

      <WorkoutsStats
        workoutsCount={workouts.length}
        totalSets={totalSets}
        totalTons={`${totalTons.toFixed(1)}${tonnageUnit}`}
        countLabel={t('workouts.stats.count')}
        setsLabel={t('workouts.stats.sets')}
        volumeLabel={t('workouts.stats.volume')}
      />

      <WorkoutsWeekPicker
        weekDays={weekDays}
        selectedDay={day}
        onPrevWeek={() => setWeek(w => w.subtract(1, 'week'))}
        onNextWeek={() => setWeek(w => w.add(1, 'week'))}
        onSelectDay={setDay}
        hasWorkoutForDay={hasWorkoutForDay}
      />

      {isOffline && dayWorkouts.length === 0 ? (
        <WorkoutsEmptyState
          offline
          title={t('common.offline')}
          text={t('common.offline_desc')}
        />
      ) : loadError && dayWorkouts.length === 0 ? (
        <WorkoutsEmptyState
          offline={false}
          title={t('common.error')}
          text={t('common.retry')}
        />
      ) : dayWorkouts.length === 0 ? (
        <WorkoutsEmptyState
          offline={false}
          title={t('workouts.empty.title')}
          text={t('workouts.empty.text', { date: day.format('D MMMM') })}
        />
      ) : dayWorkouts.map(workout => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          repsLabel={t('workouts.add.reps').toLowerCase()}
          kgLabel={t('workouts.add.kg').toLowerCase()}
          noWeightLabel={t('workouts.add.no_weight')}
          onDeleted={load}
        />
      ))}

      <WorkoutsFabPortal
        modalOpen={modalOpen}
        onOpenModal={() => setModalOpen(true)}
        onCloseModal={() => setModalOpen(false)}
        day={day}
        onCreated={load}
      />
    </>
  )
}
