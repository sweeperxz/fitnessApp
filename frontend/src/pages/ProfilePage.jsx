import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import api, { getProfile, upsertProfile, getMe } from '../api'
import { useAuthContext } from '../auth/AuthContext'
import { getTheme, toggleTheme } from '../utils/theme'
import { tapHaptic, successHaptic, mediumHaptic } from '../utils/haptic'
import { getSubscription, subscribeUser, unsubscribeUser, checkPushSupport } from '../utils/push'
import './profile/ProfilePage.css'
import ProfileHeaderCard from './profile/components/ProfileHeaderCard'
import ProfileTabBar from './profile/components/ProfileTabBar'
import ProfileGoalsCard from './profile/components/ProfileGoalsCard'
import ProfileMacrosCard from './profile/components/ProfileMacrosCard'
import ProfileSettingsCard from './profile/components/ProfileSettingsCard'
import ProfileNotificationsCard from './profile/components/ProfileNotificationsCard'
import ProfileAccountCard from './profile/components/ProfileAccountCard'
import ProfileAboutCard from './profile/components/ProfileAboutCard'

const GOALS = [{ v: 'lose', lKey: 'goals.lose' }, { v: 'maintain', lKey: 'goals.maintain' }, { v: 'gain', lKey: 'goals.gain' }]
const ACTS = [{ v: 'low', lKey: 'activity.low' }, { v: 'medium', lKey: 'activity.medium' }, { v: 'high', lKey: 'activity.high' }]

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { signOut } = useAuthContext()
  const [form, setForm] = useState({ weight: 70, goal: 'maintain', activity: 'medium', water_goal: 2500, calories_goal: 2000, protein_goal: 150, fat_goal: 70, carbs_goal: 250, fatsecret_region: 'default' })
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('goals')
  const [saved, setSaved] = useState(false)
  const [themeMode, setThemeMode] = useState(getTheme())
  const [pushSupported, setPushSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    checkPushSupport().then(setPushSupported)
    getSubscription().then(sub => setIsSubscribed(!!sub))
  }, [])

  useEffect(() => {
    getMe().then(u => setUser(u)).catch(() => { })
    getProfile().then(p => setForm(f => ({ ...f, ...p }))).catch(() => { })
  }, [])

  const handlePushToggle = async () => {
    tapHaptic()
    if (isSubscribed) {
      await unsubscribeUser()
      setIsSubscribed(false)
    } else {
      try {
        const { data } = await api.get('/push/vapid-public-key')
        await subscribeUser(data.public_key)
        setIsSubscribed(true)
        successHaptic()
      } catch (err) {
        console.error('Push subscription failed:', err)
        const errorMsg = err.response?.data?.detail || t('profile.push_error') || 'Failed to enable notifications. Check browser permissions.'
        alert(errorMsg)
      }
    }
  }

  const testPush = async () => {
    try {
      await api.post('/push/test')
      successHaptic()
      alert(t('profile.push_test_success') || '✅ Test notification sent!')
    } catch (err) {
      console.error('Push test failed:', err)
      const errorMsg = err.response?.data?.detail || err.message
      alert(errorMsg)
    }
  }

  const upd = (k, v) => {
    if (['weight', 'water_goal', 'calories_goal', 'protein_goal', 'fat_goal', 'carbs_goal'].includes(k)) {
      const numVal = parseFloat(v)
      if (numVal < 0 || isNaN(numVal)) return
    }
    setForm(f => ({ ...f, [k]: v }))
  }

  const handleCalculateGoals = async () => {
    setCalculating(true)
    try {
      const { data } = await api.post('/profile/calculate-goals', {
        weight: form.weight,
        height: 175,
        age: 30,
        gender: 'male',
        goal: form.goal,
        activity: form.activity,
      })
      setForm(f => ({ ...f, ...data }))
      successHaptic()
    } catch (err) {
      console.error('Calculation failed:', err)
      alert('Ошибка расчета целей')
    } finally {
      setCalculating(false)
    }
  }

  const save = async () => {
    await upsertProfile(form)
    successHaptic()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTabChange = (nextTab) => {
    tapHaptic()
    setTab(nextTab)
  }

  const handleGoalSelect = (goal) => {
    tapHaptic()
    upd('goal', goal)
  }

  const handleActivitySelect = (activity) => {
    tapHaptic()
    upd('activity', activity)
  }

  const handleThemeToggle = () => {
    tapHaptic()
    setThemeMode(toggleTheme())
  }

  const handleLanguageChange = (language) => {
    tapHaptic()
    i18n.changeLanguage(language)
  }

  const handleLogout = () => {
    mediumHaptic()
    signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">{t('profile.title').slice(0, 4)}<span>{t('profile.title').slice(4)}</span></div>
      </div>

      <ProfileHeaderCard user={user} t={t} />

      <ProfileTabBar tab={tab} onChange={handleTabChange} t={t} />

      {tab === 'goals' && (
        <>
          <ProfileGoalsCard
            form={form}
            goals={GOALS}
            acts={ACTS}
            calculating={calculating}
            onUpdate={upd}
            onSelectGoal={handleGoalSelect}
            onSelectActivity={handleActivitySelect}
            onRecalculate={handleCalculateGoals}
            t={t}
          />

          <ProfileMacrosCard form={form} onUpdate={upd} t={t} />

          <button className="btn-primary profile-save-btn" onClick={save}>
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </>
      )}

      {tab === 'settings' && (
        <>
          <ProfileSettingsCard
            themeMode={themeMode}
            language={i18n.language}
            fatsecretRegion={form.fatsecret_region}
            onThemeToggle={handleThemeToggle}
            onLanguageChange={handleLanguageChange}
            onFatsecretRegionChange={value => upd('fatsecret_region', value)}
            t={t}
          />

          {pushSupported && (
            <ProfileNotificationsCard
              isSubscribed={isSubscribed}
              onToggle={handlePushToggle}
              onTestPush={testPush}
              t={t}
            />
          )}

          <ProfileAccountCard
            email={user?.email}
            onLogout={handleLogout}
            t={t}
          />

          <ProfileAboutCard t={t} />

          <button className="btn-primary profile-save-btn" onClick={save}>
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </>
      )}
    </>
  )
}
