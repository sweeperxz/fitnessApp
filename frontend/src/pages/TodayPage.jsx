import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/uk'
import { addMeal, deleteMeal, logWater } from '../api'
import { AppLayoutContext } from '../components/AppShell'
import { tapHaptic, successHaptic } from '../utils/haptic'
import { MEAL_TYPES } from '../utils/constants'
import './today/TodayPage.css'
import TodayHeader from './today/components/TodayHeader'
import StatusBanner from './today/components/StatusBanner'
import NutritionCard from './today/components/NutritionCard'
import WaterCard from './today/components/WaterCard'
import AiTipsCard from './today/components/AiTipsCard'
import MealsCard from './today/components/MealsCard'
import TodayFabPortal from './today/components/TodayFabPortal'
import { useTodayData } from './today/hooks/useTodayData'
import { useTodaySync } from './today/hooks/useTodaySync'
import { useAiTips } from './today/hooks/useAiTips'

export default function TodayPage() {
  const { t, i18n } = useTranslation()
  const { setBlockingOverlay } = React.useContext(AppLayoutContext)
  const [day, setDay] = useState(dayjs())
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    dayjs.locale(i18n.language === 'en' ? 'en' : 'uk')
  }, [i18n.language])

  useEffect(() => {
    setBlockingOverlay?.(modalOpen)
    return () => setBlockingOverlay?.(false)
  }, [modalOpen, setBlockingOverlay])

  const {
    data,
    profile,
    isOffline,
    setIsOffline,
    setData,
    load,
    fallbackProfile,
    emptyNutrition,
  } = useTodayData(day)

  const {
    syncing,
    hasUnsyncedData,
    showSyncSuccess,
    queueWaterOffline,
    queueAddMealOffline,
  } = useTodaySync({ day, load, setData, setIsOffline })

  const pr = profile || fallbackProfile
  const d = data || emptyNutrition

  const remaining = Math.max(pr.calories_goal - d.total_calories, 0)
  const waterPct = Math.min((d.water_ml / pr.water_goal) * 100, 100)

  const isToday = day.isSame(dayjs(), 'day')
  const dayLabel = isToday
    ? t('common.today')
    : day.isSame(dayjs().subtract(1, 'day'), 'day')
      ? t('common.yesterday')
      : day.locale(i18n.language).format('D MMMM')

  const macros = useMemo(() => [
    { l: t('today.protein'), v: d.total_protein, g: pr.protein_goal, c: 'var(--purple)' },
    { l: t('today.fat'), v: d.total_fat, g: pr.fat_goal, c: 'var(--amber)' },
    { l: t('today.carbs'), v: d.total_carbs, g: pr.carbs_goal, c: 'var(--blue)' },
  ], [d.total_protein, d.total_fat, d.total_carbs, pr.protein_goal, pr.fat_goal, pr.carbs_goal, t])

  const groups = useMemo(() =>
    MEAL_TYPES
      .map(type => ({ type, items: d.meals.filter(m => m.meal_type === type) }))
      .filter(group => group.items.length > 0),
  [d.meals])

  const {
    tipsOpen,
    aiTips,
    tipsLoading,
    toggleTips,
  } = useAiTips({
    day,
    dayLabel,
    nutrition: d,
    profile: pr,
  })

  const addWaterWithValidation = useCallback(async (ml) => {
    tapHaptic()

    if (isOffline) {
      queueWaterOffline(ml)
      successHaptic()
      return
    }

    try {
      await logWater({ day: day.format('YYYY-MM-DD'), amount_ml: ml })
      successHaptic()
      load()
    } catch (err) {
      const detail = err?.response?.data?.detail
      const code = typeof detail === 'object' ? detail?.code : null

      if (code === 'WATER_SINGLE_LIMIT_EXCEEDED') {
        alert(t('today.water_warning_single'))
        return
      }

      if (code === 'WATER_DAILY_LIMIT_EXCEEDED') {
        alert(t('today.water_warning_daily'))
        return
      }

      const fallbackMessage = typeof detail === 'object' ? detail?.message : null
      if (fallbackMessage) {
        alert(fallbackMessage)
      }
    }
  }, [day, isOffline, load, queueWaterOffline, t])

  const handleDeleteMeal = useCallback((mealId) => {
    deleteMeal(mealId).then(load)
  }, [load])

  const handleAddMeal = useCallback(async (meal) => {
    if (isOffline) {
      queueAddMealOffline(meal)
      setModalOpen(false)
      return
    }

    await addMeal({ ...meal, day: day.format('YYYY-MM-DD') })
    await load()
    setModalOpen(false)
  }, [day, isOffline, load, queueAddMealOffline])

  return (
    <>
      <TodayHeader
        dayLabel={dayLabel}
        onPrevDay={() => setDay(prev => prev.subtract(1, 'day'))}
        onNextDay={() => setDay(prev => prev.add(1, 'day'))}
      />

      {isOffline && (
        <StatusBanner
          variant="offline"
          title={t('common.offline')}
          description={hasUnsyncedData ? t('common.offline_toast') : t('common.offline_desc')}
        />
      )}

      {syncing && (
        <StatusBanner
          variant="syncing"
          title={t('common.syncing') || 'Синхронізація...'}
        />
      )}

      {showSyncSuccess && (
        <StatusBanner
          variant="success"
          title={t('common.synced_toast')}
        />
      )}

      <NutritionCard
        data={data}
        profile={pr}
        macros={macros}
        remaining={remaining}
        t={t}
      />

      <WaterCard
        waterMl={d.water_ml}
        waterGoal={pr.water_goal}
        waterPct={waterPct}
        onAddWater={addWaterWithValidation}
        t={t}
      />

      <AiTipsCard
        tipsOpen={tipsOpen}
        tipsLoading={tipsLoading}
        aiTips={aiTips}
        onToggle={toggleTips}
        t={t}
      />

      <MealsCard
        isOffline={isOffline}
        groups={groups}
        t={t}
        onDeleteMeal={handleDeleteMeal}
      />

      <TodayFabPortal
        modalOpen={modalOpen}
        onOpenModal={() => setModalOpen(true)}
        onCloseModal={() => setModalOpen(false)}
        onAddMeal={handleAddMeal}
      />
    </>
  )
}
