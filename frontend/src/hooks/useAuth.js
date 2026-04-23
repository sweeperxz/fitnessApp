import { useState, useEffect } from 'react'
import { getMe, login, register, googleAuth, setToken as saveToken, clearAuthState } from '../api'

/**
 * Хук для управления аутентификацией
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Проверка текущего пользователя при монтировании
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const userData = await getMe()
      setUser(userData)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const loginUser = async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      const data = await login(credentials)
      saveToken(data.access_token)
      setUser(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const registerUser = async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      const data = await register(credentials)
      saveToken(data.access_token)
      setUser(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async (credential) => {
    setLoading(true)
    setError(null)
    try {
      const data = await googleAuth({ credential })
      saveToken(data.access_token)
      setUser(data)
      return data
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка Google авторизации')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearAuthState()
    setUser(null)
  }

  return {
    user,
    loading,
    error,
    loginUser,
    registerUser,
    loginWithGoogle,
    logout,
    checkAuth
  }
}
