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
  const [mode, setMode]       = useState('google') // google | email
  const [sub,  setSub]        = useState('login')  // login | register
  const [form, setForm]       = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [gReady, setGReady]   = useState(false)
  const btnRef = useRef(null)

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

  // Рендерим кнопку Google когда GSI готов
  useEffect(() => {
    if (!gReady || !btnRef.current || !G_CLIENT_ID) return
    window.google.accounts.id.renderButton(btnRef.current, {
      type:  'standard',
      theme: 'filled_black',
      size:  'large',
      text:  'continue_with',
      shape: 'rectangular',
      locale: 'ru',
      width: btnRef.current.offsetWidth || 340,
    })
  }, [gReady, mode])

  const submitEmail = async () => {
    setError('')
    if (!form.email || !form.password) return setError('Заполни все поля')
    if (sub === 'register' && !form.name)        return setError('Введи имя')
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
          Fit<span style={{ color: 'var(--blue2)' }}>Flow</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Персональный фитнес-трекер</div>
      </div>

      <div className="auth-card">
        {/* ── Google (основной способ) ── */}
        {G_CLIENT_ID ? (
          <>
            {loading && mode === 'google' ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text2)', fontSize: 14 }}>Вход...</div>
            ) : (
              <div ref={btnRef} style={{ width: '100%', minHeight: 44, marginBottom: 16 }} />
            )}

            {error && mode === 'google' && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>или войти через email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        ) : (
          // Показываем подсказку если GOOGLE_CLIENT_ID не настроен
          <div style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--blue2)' }}>Google Sign-In не настроен.</strong><br />
            Добавь в <code>.env</code> файл:<br />
            <code style={{ color: 'var(--blue2)' }}>VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com</code>
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
