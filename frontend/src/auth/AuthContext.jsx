import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearAuthState, getMe, getToken, setToken } from '../api'

/**
 * Глобальное auth-состояние: token + текущий пользователь.
 * Заменило прежнее `status` (auth | onboarding | app) + `role` в App.jsx.
 *
 * Стратегия:
 *  - Если в localStorage есть токен — пробуем `/auth/me`.
 *  - Если /auth/me падает, но мы оффлайн — берём кешированные `_nutrio_*` поля,
 *    чтобы PWA не выкидывало пользователя на /auth при отсутствии сети.
 *  - Если /auth/me падает на полноценной сети — токен битый, чистим и идём на /auth.
 */
const AuthContext = createContext(null)

const HAS_PROFILE_KEY = '_nutrio_has_profile'
const ROLE_KEY = '_nutrio_role'

function readCachedUser() {
  return {
    has_profile: localStorage.getItem(HAS_PROFILE_KEY) === '1',
    role: localStorage.getItem(ROLE_KEY) || 'user',
  }
}

function persistUserCache(user) {
  if (!user) {
    localStorage.removeItem(HAS_PROFILE_KEY)
    localStorage.removeItem(ROLE_KEY)
    return
  }
  localStorage.setItem(HAS_PROFILE_KEY, user.has_profile ? '1' : '0')
  localStorage.setItem(ROLE_KEY, user.role || 'user')
}

export function AuthProvider({ children }) {
  // null = ещё грузим, false = не залогинен, объект = залогинен
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setUser(false)
      setLoading(false)
      return
    }

    getMe()
      .then((d) => {
        const next = { ...d, ...readCachedUser(), has_profile: !!d.has_profile, role: d.role || 'user' }
        setUser(next)
        persistUserCache(next)
      })
      .catch((err) => {
        if (err.isOffline || !navigator.onLine) {
          // Оффлайн — доверяем кешу, чтобы не выбрасывать на /auth на ровном месте
          setUser({ ...readCachedUser() })
        } else {
          clearAuthState()
          persistUserCache(null)
          setUser(false)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback((tokenResponse) => {
    setToken(tokenResponse.access_token)
    const next = {
      user_id: tokenResponse.user_id,
      email: tokenResponse.email,
      name: tokenResponse.name,
      role: tokenResponse.role || 'user',
      has_profile: !!tokenResponse.has_profile,
    }
    setUser(next)
    persistUserCache(next)
  }, [])

  const signOut = useCallback(() => {
    clearAuthState()
    persistUserCache(null)
    setUser(false)
  }, [])

  const markProfileComplete = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, has_profile: true }
      persistUserCache(next)
      return next
    })
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasProfile: !!(user && user.has_profile),
    role: user ? user.role || 'user' : 'user',
    signIn,
    signOut,
    markProfileComplete,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>')
  return ctx
}
