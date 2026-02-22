import React, { useState, useEffect } from 'react'
import TodayPage from './pages/TodayPage'
import WorkoutsPage from './pages/WorkoutsPage'
import StatsPage from './pages/StatsPage'
import ProfilePage from './pages/ProfilePage'
import AIPage from './pages/AIPage'
import OnboardingPage from './pages/OnboardingPage'
import AuthPage from './pages/AuthPage'
import { getToken, getMe, removeToken } from './api'

// ─── Update Banner (flex item, NOT fixed) ───────────────
function UpdateBanner() {
  const [show, setShow] = useState(false)
  const [worker, setWorker] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            setWorker(nw)
            setShow(true)
          }
        })
      })
      // Проверяем раз в минуту
      setInterval(() => reg.update(), 60_000)
    }).catch(() => { })

    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'UPDATE_AVAILABLE') setShow(true)
    })
  }, [])

  if (!show) return null

  return (
    <div className="update-banner">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Новая версия готова</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>Обнови приложение</div>
      </div>
      <button
        onClick={() => { worker?.postMessage({ type: 'SKIP_WAITING' }); window.location.reload() }}
        style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
        Обновить
      </button>
      <button onClick={() => setShow(false)}
        style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}>
        ×
      </button>
    </div>
  )
}

// ─── Nav icons ──────────────────────────────────────────
const NAV = [
  {
    id: 'today', label: 'Питание',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>
  },
  {
    id: 'workouts', label: 'Трени',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M6 12h12M3 8h2M3 16h2M19 8h2M19 16h2" /></svg>
  },
  {
    id: 'stats', label: 'Прогресс',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
  },
  {
    id: 'ai', label: 'ИИ',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" /></svg>
  },
  {
    id: 'profile', label: 'Профиль',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
  },
]

export default function App() {
  const [status, setStatus] = useState(null) // null | auth | onboarding | app
  const [tab, setTab] = useState('today')

  useEffect(() => {
    const token = getToken()
    if (!token) return setStatus('auth')
    getMe()
      .then(d => setStatus(d.has_profile ? 'app' : 'onboarding'))
      .catch(() => { removeToken(); setStatus('auth') })
  }, [])

  // Loading — shimmer skeleton
  if (status === null) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Nut<span style={{ color: 'var(--blue2)' }}>rio</span>
        </div>
        <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
      </div>
      {/* Skeleton cards */}
      <div className="skeleton-screen">
        <div className="skeleton skeleton-header" />
        <div className="skeleton skeleton-card" style={{ height: 140 }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" style={{ height: 60 }} />
      </div>
    </div>
  )

  if (status === 'auth') return <AuthPage onAuth={d => setStatus(d.has_profile ? 'app' : 'onboarding')} />
  if (status === 'onboarding') return <OnboardingPage onDone={() => setStatus('app')} />

  const pages = {
    today: <TodayPage />,
    workouts: <WorkoutsPage />,
    stats: <StatsPage />,
    ai: <AIPage />,
    profile: <ProfilePage onLogout={() => { removeToken(); setStatus('auth') }} />,
  }

  return (
    // This div is #root's direct child — fills 100% height via flex
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <UpdateBanner />
      <div className="app">
        <div className="page page-enter" key={tab}>
          {pages[tab]}
        </div>
        <nav className="bottom-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item${tab === n.id ? ' active' : ''}`}
              onClick={() => setTab(n.id)}
            >
              {n.icon(tab === n.id)}
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
