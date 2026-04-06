import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { googleAuth, register, login, setToken } from '../api'
import { useFormValidation } from '../hooks/useFormValidation'

const G_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// ─── Google GSI ─────────────────────────────────────────
function loadGSI(callback) {
  if (window.google?.accounts?.id) { callback(); return }
  const s = document.createElement('script')
  s.src = 'https://accounts.google.com/gsi/client'
  s.async = true
  s.defer = true
  s.onload = callback
  document.head.appendChild(s)
}

export default function AuthPage({ onAuth }) {
  const { t, i18n } = useTranslation()
  const [sub, setSub] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gReady, setGReady] = useState(false)

  const btnRef = useRef(null)
  const wrapperRef = useRef(null)

  // Validation rules based on mode
  const validationRules = useMemo(() => ({
    email: { type: 'email' },
    password: { type: 'password', params: [6] },
    ...(sub === 'register' && {
      name: { type: 'name' },
      confirmPassword: (value, values) => {
        if (!value) return t('auth.errors.all_fields')
        if (value !== values.password) return t('auth.errors.pass_mismatch') || 'Пароли не совпадают'
        return null
      }
    })
  }), [sub, t])

  const {
    values: form,
    errors: fieldErrors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid
  } = useFormValidation(
    { email: '', password: '', confirmPassword: '', name: '' },
    validationRules
  )

  const upd = useCallback((k, v) => {
    setValue(k, v)
    setError('')
  }, [setValue])

  const switchMode = useCallback((newMode) => {
    setSub(newMode)
    reset()
    setError('')
  }, [reset])

  useEffect(() => {
    if (!G_CLIENT_ID) return
    loadGSI(() => {
      window.google.accounts.id.initialize({
        client_id: G_CLIENT_ID,
        callback: async (resp) => {
          setLoading(true); setError('')
          try {
            const data = await googleAuth({ credential: resp.credential })
            setToken(data.access_token)
            onAuth(data)
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
      setToken(data.access_token)
      onAuth(data)
    } catch (e) {
      setError(e.response?.data?.detail || t('auth.errors.auth_error'))
    }
    setLoading(false)
  }, [validateAll, sub, form, onAuth, t])

  return (
    <div className="auth-wrap fade-in">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
          Nut<span style={{ color: 'var(--blue)' }}>rio</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t('auth.slogan')}</div>
      </div>

      <div className="auth-card">
        {G_CLIENT_ID ? (
          <>
            <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height: 48, marginBottom: 16, borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <button
                style={{
                  width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font)',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? t('auth.loading') : t('auth.continue_google')}
              </button>
              <div
                ref={btnRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, opacity: 0 }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t('auth.or_email')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        ) : (
          <div style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--amber)' }}>{t('auth.no_google')}</strong><br />
            {t('auth.add_env')}<br />
            <code style={{ color: 'var(--amber)' }}>VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com</code>
          </div>
        )}

        {/* ── Email / Password ── */}
        <div className="tab-bar" style={{ marginBottom: 16 }}>
          {[['login', t('auth.tabs.login')], ['register', t('auth.tabs.register')]].map(([m, l]) => (
            <button key={m} className={`tab-btn${sub === m ? ' active' : ''}`}
              onClick={() => switchMode(m)}>{l}</button>
          ))}
        </div>

        {sub === 'register' && (
          <div className="form-group">
            <div className="input-label">{t('auth.fields.name')}</div>
            <input
              className="input"
              placeholder={t('auth.fields.name_ph')}
              value={form.name}
              onChange={e => upd('name', e.target.value)}
              onBlur={() => setFieldTouched('name')}
              autoComplete="name"
              style={touched.name && fieldErrors.name ? { borderColor: 'var(--red)' } : {}}
            />
            {touched.name && fieldErrors.name && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{fieldErrors.name}</div>
            )}
          </div>
        )}

        <div className="form-group">
          <div className="input-label">{t('auth.fields.email')}</div>
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
          {touched.email && fieldErrors.email && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{fieldErrors.email}</div>
          )}
        </div>

        <div className="form-group">
          <div className="input-label">{t('auth.fields.password')}</div>
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
          {touched.password && fieldErrors.password && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{fieldErrors.password}</div>
          )}
        </div>

        {sub === 'register' && (
          <div className="form-group">
            <div className="input-label">{t('auth.fields.confirm_password') || 'Подтвердите пароль'}</div>
            <input
              className="input"
              type="password"
              placeholder={t('auth.fields.confirm_password_ph') || 'Повторите пароль'}
              value={form.confirmPassword}
              onChange={e => upd('confirmPassword', e.target.value)}
              onBlur={() => setFieldTouched('confirmPassword')}
              onKeyDown={e => e.key === 'Enter' && submitEmail()}
              autoComplete="new-password"
              style={touched.confirmPassword && fieldErrors.confirmPassword ? { borderColor: 'var(--red)' } : {}}
            />
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{fieldErrors.confirmPassword}</div>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#fca5a5' }}>
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