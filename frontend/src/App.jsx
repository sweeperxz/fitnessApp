import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'

import { AuthProvider, useAuthContext } from './auth/AuthContext'
import { GuestOnly, RequireAdmin, RequireAuth, RequireProfile } from './auth/guards'
import AppShell from './components/AppShell'
import { applyTheme } from './utils/theme'

// Lazy-loaded pages (code-splitting)
const TodayPage = React.lazy(() => import('./pages/TodayPage'))
const WorkoutsPage = React.lazy(() => import('./pages/WorkoutsPage'))
const StatsPage = React.lazy(() => import('./pages/StatsPage'))
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const AIPage = React.lazy(() => import('./pages/AIPage'))
const AdminPage = React.lazy(() => import('./pages/AdminPage'))

function BootSkeleton() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <div style={{ padding: '20px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Nut<span style={{ color: 'var(--blue2)' }}>rio</span>
        </div>
        <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
      </div>
      <div className="skeleton-screen">
        <div className="skeleton skeleton-header" />
        <div className="skeleton skeleton-card" style={{ height: 140 }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" style={{ height: 60 }} />
      </div>
    </div>
  )
}

function AppRoutes() {
  const { loading } = useAuthContext()
  if (loading) return <BootSkeleton />

  return (
    <Routes>
      <Route path="/auth" element={<GuestOnly><AuthPage /></GuestOnly>} />
      <Route
        path="/onboarding"
        element={<RequireAuth><OnboardingPage /></RequireAuth>}
      />
      <Route element={<RequireProfile><AppShell /></RequireProfile>}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      </Route>
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}

export default function App() {
  useEffect(() => { applyTheme() }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
