import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AUTH_EXPIRED_EVENT, clearAuthState, getMe, getToken, setToken } from '../api'

/**
 * Глобальное auth-состояние: token + текущий пользователь.
 * Заменило прежнее `status` (auth | onboarding | app) + `role` в App.jsx.
 *
 * Стратегия:
 *  - Если в localStorage есть токен — пробуем `/auth/me`.
 *  - Если /auth/me падает, но мы оффлайн — берём кешированные `_nutrio_*` поля,
 *    чтобы PWA не выкидывало пользователя на /auth при отсутствии сети.
 *  - Если /auth/me падает на полноценной сети — токен битый, чистим и идём на /auth.
 *  - Если кто-то из API получил 401 — слушаем `nutrio:auth-expired` и сами
 *    делаем soft-logout (без `window.location.reload()`, см. api/index.js).
 */
const AuthContext = createContext(null)

const HAS_PROFILE_KEY = '_nutrio_has_profile'
const ROLE_KEY = '_nutrio_role'
const USER_ID_KEY = '_nutrio_user_id'
const USER_EMAIL_KEY = '_nutrio_user_email'
const USER_NAME_KEY = '_nutrio_user_name'

function readCachedUser() {
  // Кешируем НЕ только has_profile/role, но и идентификационные поля —
  // иначе в оффлайне `user.user_id` undefined (использует AdminPage для
  // self-id чеков, см. N15 в audit v2).
  const userIdRaw = localStorage.getItem(USER_ID_KEY)
  const parsedUserId = userIdRaw ? Number(userIdRaw) : null
  return {
    user_id: Number.isFinite(parsedUserId) ? parsedUserId : null,
    email: localStorage.getItem(USER_EMAIL_KEY) || '',
    name: localStorage.getItem(USER_NAME_KEY) || '',
    has_profile: localStorage.getItem(HAS_PROFILE_KEY) === '1',
    role: localStorage.getItem(ROLE_KEY) || 'user',
  }
}

function persistUserCache(user) {
  if (!user) {
    localStorage.removeItem(HAS_PROFILE_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(USER_EMAIL_KEY)
    localStorage.removeItem(USER_NAME_KEY)
    return
  }
  localStorage.setItem(HAS_PROFILE_KEY, user.has_profile ? '1' : '0')
  localStorage.setItem(ROLE_KEY, user.role || 'user')
  if (user.user_id != null) localStorage.setItem(USER_ID_KEY, String(user.user_id))
  if (user.email) localStorage.setItem(USER_EMAIL_KEY, user.email)
  if (user.name) localStorage.setItem(USER_NAME_KEY, user.name)
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
        // Серверный ответ — единственный источник истины, когда онлайн.
        // Раньше тут был `{ ...d, ...readCachedUser(), has_profile, role }` —
        // спред кеша сразу же перезаписывался explicit-полями ниже, dead code.
        const next = {
          user_id: d.user_id,
          email: d.email,
          name: d.name,
          has_profile: !!d.has_profile,
          role: d.role || 'user',
        }
        setUser(next)
        persistUserCache(next)
      })
      .catch((err) => {
        if (err.isOffline || !navigator.onLine) {
          // Оффлайн — доверяем кешу, чтобы не выбрасывать на /auth на ровном месте
          setUser(readCachedUser())
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

  // Soft-logout: api-interceptor поймал 401, AuthState уже почищен (см.
  // api/index.js), нам остаётся только снять юзера в стейте — guards
  // редиректят на /auth.
  useEffect(() => {
    const handler = () => {
      persistUserCache(null)
      setUser(false)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
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
