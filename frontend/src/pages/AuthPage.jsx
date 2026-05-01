import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { googleAuth, register, login } from '../api'
import { useAuthContext } from '../auth/AuthContext'
import { useFormValidation } from '../hooks/useFormValidation'
import AuthBrand from './auth/components/AuthBrand'
import AuthGoogleSection from './auth/components/AuthGoogleSection'
import AuthModeTabs from './auth/components/AuthModeTabs'
import AuthInputField from './auth/components/AuthInputField'

const G_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function loadGSI(callback) {
  if (window.google?.accounts?.id) {
    callback()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = callback
  document.head.appendChild(script)
}

export default function AuthPage() {
  const { t, i18n } = useTranslation()
  const { signIn } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [sub, setSub] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gReady, setGReady] = useState(false)

  const btnRef = useRef(null)
  const wrapperRef = useRef(null)

  const validationRules = useMemo(
    () => ({
      email: { type: 'email' },
      password: { type: 'password', params: [6] },
      ...(sub === 'register' && {
        name: { type: 'name' },
        confirmPassword: (value, values) => {
          if (!value) return t('auth.errors.all_fields')
          if (value !== values.password) return t('auth.errors.pass_mismatch')
          return null
        },
      }),
    }),
    [sub, t],
  )

  const {
    values: form,
    errors: fieldErrors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid,
  } = useFormValidation({ email: '', password: '', confirmPassword: '', name: '' }, validationRules)

  const upd = useCallback(
    (key, value) => {
      setValue(key, value)
      setError('')
    },
    [setValue],
  )

  const switchMode = useCallback(
    nextMode => {
      setSub(nextMode)
      reset()
      setError('')
    },
    [reset],
  )

  useEffect(() => {
    if (!G_CLIENT_ID) return

    loadGSI(() => {
      window.google.accounts.id.initialize({
        client_id: G_CLIENT_ID,
        callback: async resp => {
          setLoading(true)
          setError('')
          try {
            const data = await googleAuth({ credential: resp.credential })
            signIn(data)
            const fallback = data.has_profile ? '/today' : '/onboarding'
            navigate(location.state?.from?.pathname || fallback, { replace: true })
          } catch (e) {
            setError(e.response?.data?.detail || t('auth.google_error'))
          }
          setLoading(false)
        },
        use_fedcm_for_prompt: true,
      })
      setGReady(true)
    })
  }, [t])

  useEffect(() => {
    if (!gReady || !btnRef.current || !wrapperRef.current || !G_CLIENT_ID) return

    window.google.accounts.id.renderButton(btnRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      locale: i18n.language === 'en' ? 'en' : 'uk',
      width: wrapperRef.current.offsetWidth || 340,
    })
  }, [gReady, i18n.language, t])

  const submitEmail = useCallback(async () => {
    setError('')

    if (!validateAll()) {
      setError(t('auth.errors.all_fields'))
      return
    }

    setLoading(true)
    try {
      const data = await (sub === 'register' ? register : login)(form)
      signIn(data)
      const fallback = data.has_profile ? '/today' : '/onboarding'
      navigate(location.state?.from?.pathname || fallback, { replace: true })
    } catch (e) {
      if (sub === 'login' && [400, 401].includes(e.response?.status)) {
        setError(t('auth.errors.invalid_credentials'))
      } else {
        setError(e.response?.data?.detail || t('auth.errors.auth_error'))
      }
    }
    setLoading(false)
  }, [validateAll, sub, form, signIn, navigate, location.state, t])

  return (
    <div className="auth-wrap fade-in">
      <AuthBrand slogan={t('auth.slogan')} />

      <div className="auth-card">
        <AuthGoogleSection
          hasGoogleClientId={Boolean(G_CLIENT_ID)}
          loading={loading}
          error={error}
          t={t}
          wrapperRef={wrapperRef}
          btnRef={btnRef}
        />

        <AuthModeTabs
          mode={sub}
          loginLabel={t('auth.tabs.login')}
          registerLabel={t('auth.tabs.register')}
          onSwitch={switchMode}
        />

        {sub === 'register' && (
          <AuthInputField label={t('auth.fields.name')} error={touched.name ? fieldErrors.name : ''}>
            <input
              className="input"
              placeholder={t('auth.fields.name_ph')}
              value={form.name}
              onChange={e => upd('name', e.target.value)}
              onBlur={() => setFieldTouched('name')}
              autoComplete="name"
              style={touched.name && fieldErrors.name ? { borderColor: 'var(--red)' } : {}}
            />
          </AuthInputField>
        )}

        <AuthInputField label={t('auth.fields.email')} error={touched.email ? fieldErrors.email : ''}>
          <input
            className="input"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => upd('email', e.target.value)}
            onBlur={() => setFieldTouched('email')}
            onKeyDown={e => e.key === 'Enter' && submitEmail()}
            autoComplete="email"
            style={touched.email && fieldErrors.email ? { borderColor: 'var(--red)' } : {}}
          />
        </AuthInputField>

        <AuthInputField label={t('auth.fields.password')} error={touched.password ? fieldErrors.password : ''}>
          <input
            className="input"
            type="password"
            placeholder={t('auth.fields.password_ph')}
            value={form.password}
            onChange={e => upd('password', e.target.value)}
            onBlur={() => setFieldTouched('password')}
            onKeyDown={e => e.key === 'Enter' && sub !== 'register' && submitEmail()}
            autoComplete={sub === 'register' ? 'new-password' : 'current-password'}
            style={touched.password && fieldErrors.password ? { borderColor: 'var(--red)' } : {}}
          />
        </AuthInputField>

        {sub === 'register' && (
          <AuthInputField
            label={t('auth.fields.confirm_password')}
            error={touched.confirmPassword ? fieldErrors.confirmPassword : ''}
          >
            <input
              className="input"
              type="password"
              placeholder={t('auth.fields.confirm_password_ph')}
              value={form.confirmPassword}
              onChange={e => upd('confirmPassword', e.target.value)}
              onBlur={() => setFieldTouched('confirmPassword')}
              onKeyDown={e => e.key === 'Enter' && submitEmail()}
              autoComplete="new-password"
              style={touched.confirmPassword && fieldErrors.confirmPassword ? { borderColor: 'var(--red)' } : {}}
            />
          </AuthInputField>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={submitEmail}
          disabled={loading || (Object.keys(touched).length > 0 && !isValid)}
        >
          {loading ? t('auth.loading') : sub === 'register' ? t('auth.btn.create') : t('auth.btn.login')}
        </button>
      </div>
    </div>
  )
}
