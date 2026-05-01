import React, { Suspense, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import OfflineToast from './OfflineToast'
import PageSkeleton from './PageSkeleton'
import UpdateBanner from './UpdateBanner'
import { ChunkErrorBoundary } from './ChunkErrorBoundary'

import { useAuthContext } from '../auth/AuthContext'
import useSwipe from '../utils/useSwipe'
import { tapHaptic } from '../utils/haptic'

// Маршрут (path) → ключ для иконки/лейбла. Порядок задаёт направление свайпов.
const NAV = [
  {
    path: '/today', labelKey: 'nav.nutrition',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>,
  },
  {
    path: '/workouts', labelKey: 'nav.workouts',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M6 12h12M3 8h2M3 16h2M19 8h2M19 16h2" /></svg>,
  },
  {
    path: '/stats', labelKey: 'nav.progress',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
  {
    path: '/ai', labelKey: 'nav.ai',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" /></svg>,
  },
  {
    path: '/profile', labelKey: 'nav.profile',
    icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  },
]

const ADMIN_ITEM = {
  path: '/admin', labelKey: 'nav.admin',
  icon: a => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
}

/**
 * Базовый layout для авторизованных страниц: верхний баннер обновления,
 * `<Outlet />` для текущей страницы и нижняя навигация.
 *
 * `onBlockingOverlayChange` пробрасывается через React Context страницами,
 * которые открывают модалки — он отключает свайп между табами на время модалки.
 */
export const AppLayoutContext = React.createContext({ setBlockingOverlay: () => {} })

export default function AppShell() {
  const { t } = useTranslation()
  const { role } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [hasBlockingOverlay, setHasBlockingOverlay] = useState(false)

  const items = useMemo(() => (role === 'admin' ? [...NAV, ADMIN_ITEM] : NAV), [role])

  const swipeNextTab = useCallback(() => {
    const i = items.findIndex((n) => n.path === location.pathname)
    if (i >= 0 && i < items.length - 1) {
      tapHaptic()
      navigate(items[i + 1].path)
    }
  }, [items, location.pathname, navigate])

  const swipePrevTab = useCallback(() => {
    const i = items.findIndex((n) => n.path === location.pathname)
    if (i > 0) {
      tapHaptic()
      navigate(items[i - 1].path)
    }
  }, [items, location.pathname, navigate])

  const { ref: swipeRef, handlers: swipeHandlers } = useSwipe(swipeNextTab, swipePrevTab, !hasBlockingOverlay)

  const layoutValue = useMemo(() => ({ setBlockingOverlay: setHasBlockingOverlay }), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <OfflineToast />
      <UpdateBanner />
      <div className="app">
        <div className="page" ref={swipeRef} {...swipeHandlers}>
          <div className="page-enter" key={location.pathname}>
            <ChunkErrorBoundary routeKey={location.pathname}>
              <Suspense fallback={<PageSkeleton />}>
                <AppLayoutContext.Provider value={layoutValue}>
                  <Outlet />
                </AppLayoutContext.Provider>
              </Suspense>
            </ChunkErrorBoundary>
          </div>
        </div>
        <nav className="bottom-nav">
          {items.map((n) => {
            const active = location.pathname === n.path
            return (
              <button
                key={n.path}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => { tapHaptic(); navigate(n.path) }}
              >
                {n.icon(active)}
                {t(n.labelKey)}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
