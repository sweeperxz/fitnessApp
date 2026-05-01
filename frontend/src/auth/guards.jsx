import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from './AuthContext'

/** Маршрут только для гостей (например, /auth). Залогиненных кидаем на /today. */
export function GuestOnly({ children }) {
  const { isAuthenticated, hasProfile } = useAuthContext()
  if (!isAuthenticated) return children
  return <Navigate to={hasProfile ? '/today' : '/onboarding'} replace />
}

/** Маршрут требует валидный токен, но не требует завершённого онбординга. */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthContext()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />
  return children
}

/** Маршрут требует и токен, и завершённый онбординг. */
export function RequireProfile({ children }) {
  const { isAuthenticated, hasProfile } = useAuthContext()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />
  if (!hasProfile) return <Navigate to="/onboarding" replace />
  return children
}

/** Маршрут только для админов. */
export function RequireAdmin({ children }) {
  const { role } = useAuthContext()
  if (role !== 'admin') return <Navigate to="/today" replace />
  return children
}
