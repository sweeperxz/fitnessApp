import React, { useState, useEffect, useRef } from 'react'
import { googleAuth, register, login, setToken } from '../api'

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
  const [mode, setMode]       = useState('google')
  const [sub,  setSub]        = useState('login')
  const [form, setForm]       = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [gReady, setGReady]   = useState(false)

  const btnRef = useRef(null)
  const wrapperRef = useRef(null) // Реф для контейнера, чтобы получить точную ширину

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Инициализируем Google Sign-In
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
            setError(e.response?.data?.detail || 'Ошибка Google авторизации')
          }
          setLoading(false)
        },
        use_fedcm_for_prompt: true,
      })
      setGReady(true)
    })
  }, [])

  // Рендерим скрытую кнопку Google поверх нашей
  useEffect(() => {
    if (!gReady || !btnRef.current || !wrapperRef.current || !G_CLIENT_ID) return
    window.google.accounts.id.renderButton(btnRef.current, {
      type:  'standard',
      theme: 'filled_black',
      size:  'large',
      text:  'signin_with',
      shape: 'rectangular',
      locale: 'ru',
      // Берем ширину нашего красивого контейнера
      width: wrapperRef.current.offsetWidth || 340,
    })
  }, [gReady, mode])

  const submitEmail = async () => {
    setError('')
    if (!form.email || !form.password) return setError('Заполни все поля')
    if (sub === 'register' && !form.name) return setError('Введи имя')
    if (sub === 'register' && form.password.length < 6) return setError('Пароль минимум 6 символов')
    setLoading(true)
    try {
      const data = await (sub === 'register' ? register : login)(form)
      setToken(data.access_token)
      onAuth(data)
    } catch (e) { setError(e.response?.data?.detail || 'Ошибка входа') }
    setLoading(false)
  }

  return (
    <div className="auth-wrap fade-in">
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
          Fit<span style={{ color: 'var(--accent)' }}>Flow</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Персональный фитнес-трекер</div>
      </div>

      <div className="auth-card">
        {/* ── Google (Кастомный UI + скрытый iframe) ── */}
        {G_CLIENT_ID ? (
          <>
            <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height: 48, marginBottom: 16, borderRadius: 'var(--r)', overflow: 'hidden' }}>

              {/* Наша видимая, стилизованная кнопка */}
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
                {loading && mode === 'google' ? 'Загрузка...' : 'Продолжить с Google'}
              </button>

              {/* Невидимая кнопка Google поверх нашей */}
              <div
                ref={btnRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, opacity: 0 }}
              />
            </div>

            {error && mode === 'google' && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>или по email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        ) : (
          <div style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent)' }}>Google Sign-In не настроен.</strong><br />
            Добавь в <code>.env</code> файл:<br />
            <code style={{ color: 'var(--accent)' }}>VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com</code>
          </div>
        )}

        {/* ── Email / Password ── */}
        <div className="tab-bar" style={{ marginBottom: 16 }}>
          {[['login', 'Войти'], ['register', 'Регистрация']].map(([m, l]) => (
            <button key={m} className={`tab-btn${sub === m ? ' active' : ''}`}
              onClick={() => { setSub(m); setError('') }}>{l}</button>
          ))}
        </div>

        {sub === 'register' && (
          <div className="form-group">
            <div className="input-label">Имя</div>
            <input className="input" placeholder="Как тебя зовут?" value={form.name}
              onChange={e => upd('name', e.target.value)} autoComplete="name" />
          </div>
        )}

        <div className="form-group">
          <div className="input-label">Email</div>
          <input className="input" type="email" inputMode="email" placeholder="you@example.com"
            value={form.email} onChange={e => upd('email', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitEmail()} autoComplete="email" />
        </div>

        <div className="form-group">
          <div className="input-label">Пароль</div>
          <input className="input" type="password" placeholder="Минимум 6 символов"
            value={form.password} onChange={e => upd('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitEmail()}
            autoComplete={sub === 'register' ? 'new-password' : 'current-password'} />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <button className="btn-primary" onClick={submitEmail} disabled={loading}>
          {loading ? 'Загрузка...' : sub === 'register' ? 'Создать аккаунт' : 'Войти'}
        </button>
      </div>
    </div>
  )
}