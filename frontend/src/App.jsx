import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { useTranslation, withTranslation } from 'react-i18next'
import OnboardingPage from './pages/OnboardingPage'
import AuthPage from './pages/AuthPage'
// ... (rest of imports remains similar, but I'll provide the specific chunks)
import { getToken, getMe, removeToken } from './api'
import OfflineToast from './components/OfflineToast'
import useSwipe from './utils/useSwipe'
import { tapHaptic, successHaptic, errorHaptic } from './utils/haptic'
import { applyTheme } from './utils/theme'

// ─── Lazy-loaded pages (code-splitting) ─────────────────
const TodayPage = React.lazy(() => import('./pages/TodayPage'))
const WorkoutsPage = React.lazy(() => import('./pages/WorkoutsPage'))
const StatsPage = React.lazy(() => import('./pages/StatsPage'))
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const AIPage = React.lazy(() => import('./pages/AIPage'))
const AdminPage = React.lazy(() => import('./pages/AdminPage'))

// ─── Lightweight suspense fallback ──────────────────────
function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px', marginTop: 12 }}>
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-card" style={{ height: 140 }} />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

// ─── Error boundary for offline lazy-load failures ───────
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
    this._retryTimer = null
  }

  static getDerivedStateFromError() {
    errorHaptic()
    return { crashed: true }
  }

  componentDidUpdate(prevProps) {
    // Reset when the tab changes (user navigated away and back)
    if (prevProps.tab !== this.props.tab && this.state.crashed) {
      this.setState({ crashed: false })
    }
  }

  componentDidMount() {
    // Auto-retry when connectivity is restored
    window.addEventListener('online', this._retry)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this._retry)
    clearTimeout(this._retryTimer)
  }

  _retry = () => {
    this._retryTimer = setTimeout(() => this.setState({ crashed: false }), 300)
  }

  render() {
    if (!this.state.crashed) return this.props.children

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 14, padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'var(--bg3)',
          border: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8} strokeLinecap="round">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{this.props.t('common.offline')}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            {this.props.t('common.offline_desc')}
          </div>
        </div>
        <button
          onClick={this._retry}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text2)', borderRadius: 10, padding: '10px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
          }}
        >
          {this.props.t('common.retry')}
        </button>
      </div>
    )
  }
}
const TranslatedChunkErrorBoundary = withTranslation()(ChunkErrorBoundary)

// ─── Update Banner (flex item, NOT fixed) ───────────────
function UpdateBanner() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [worker, setWorker] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // VitePWA в режиме autoUpdate сам регистрирует воркер.
    // Нам нужно только слушать сообщения об обновлениях.
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'UPDATE_AVAILABLE') setShow(true)
    })
  }, [])

  if (!show) return null

  return (
    <div className="update-banner">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{t('common.update_ready')}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{t('common.update_desc')}</div>
      </div>
      <button
        onClick={() => { successHaptic(); worker?.postMessage({ type: 'SKIP_WAITING' }); window.location.reload() }}
        style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
        {t('common.update')}
      </button>
      <button onClick={() => { tapHaptic(); setShow(false) }}
        style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}>
        ×
      </button>
    </div>
  )
}

// ─── Nav icons ──────────────────────────────────────────
const NAV = [
  {
    id: 'today', labelKey: 'nav.nutrition',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>
  },
  {
    id: 'workouts', labelKey: 'nav.workouts',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M6 12h12M3 8h2M3 16h2M19 8h2M19 16h2" /></svg>
  },
  {
    id: 'stats', labelKey: 'nav.progress',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
  },
  {
    id: 'ai', labelKey: 'nav.ai',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" /></svg>
  },
  {
    id: 'profile', labelKey: 'nav.profile',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
  },
]

export default function App() {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null) // null | auth | onboarding | app
  const [tab, setTab] = useState('today')
  const [role, setRole] = useState('user')

  useEffect(() => {
    const token = getToken()
    if (!token) return setStatus('auth')
    getMe()
      .then(d => { setStatus(d.has_profile ? 'app' : 'onboarding'); setRole(d.role || 'user') })
      .catch(() => { removeToken(); setStatus('auth') })
    applyTheme()
  }, [])

  // ── Swipe between tabs (hooks must be before any returns!) ──
  const TAB_ORDER = role === 'admin'
    ? ['today', 'workouts', 'stats', 'ai', 'profile', 'admin']
    : ['today', 'workouts', 'stats', 'ai', 'profile']

  const swipeNextTab = useCallback(() => {
    setTab(t => {
      const i = TAB_ORDER.indexOf(t)
      if (i < TAB_ORDER.length - 1) {
        tapHaptic()
        return TAB_ORDER[i + 1]
      }
      return t
    })
  }, [])
  const swipePrevTab = useCallback(() => {
    setTab(t => {
      const i = TAB_ORDER.indexOf(t)
      if (i > 0) {
        tapHaptic()
        return TAB_ORDER[i - 1]
      }
      return t
    })
  }, [])
  const { ref: swipeRef, handlers: swipeHandlers } = useSwipe(swipeNextTab, swipePrevTab)

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

  if (status === 'auth') return <AuthPage onAuth={d => { setStatus(d.has_profile ? 'app' : 'onboarding'); setRole(d.role || 'user') }} />
  if (status === 'onboarding') return <OnboardingPage onDone={() => setStatus('app')} />

  const handleLogout = () => { removeToken(); setStatus('auth') }

  return (
    // This div is #root's direct child — fills 100% height via flex
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <OfflineToast />
      <UpdateBanner />
      <div className="app">
        <div className="page" ref={swipeRef} {...swipeHandlers}>
          <div className="page-enter" key={tab}>
            <TranslatedChunkErrorBoundary tab={tab}>
              <Suspense fallback={<PageSkeleton />}>
                {tab === 'today' && <TodayPage />}
                {tab === 'workouts' && <WorkoutsPage />}
                {tab === 'stats' && <StatsPage />}
                {tab === 'ai' && <AIPage />}
                {tab === 'profile' && <ProfilePage onLogout={handleLogout} />}
                {tab === 'admin' && role === 'admin' && <AdminPage />}
              </Suspense>
            </TranslatedChunkErrorBoundary>
          </div>
        </div>
        <nav className="bottom-nav">
          {NAV.concat(role === 'admin' ? [{
            id: 'admin', labelKey: 'nav.admin',
            icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          }] : []).map(n => (
            <button
              key={n.id}
              className={`nav-item${tab === n.id ? ' active' : ''}`}
              onClick={() => { tapHaptic(); setTab(n.id) }}
            >
              {n.icon(tab === n.id)}
              {t(n.labelKey)}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
