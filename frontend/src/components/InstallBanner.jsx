import React, { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Уже установлено — не показываем
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa_banner_dismissed')) return

    // iOS Safari — показываем инструкцию
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const safari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome/.test(navigator.userAgent.toLowerCase())
    if (ios && safari) {
      setIsIOS(true)
      setShow(true)
      return
    }

    // Android Chrome / Desktop — ловим beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa_banner_dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'linear-gradient(135deg, #1a1200, #141414)',
      borderBottom: '1px solid rgba(255,184,0,0.3)',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideDown 0.3s ease',
      maxWidth: 480, margin: '0 auto'
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>📲</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          Установить FitFlowAI
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
          {isIOS
            ? 'Нажми «Поделиться» → «На экран Домой»'
            : 'Добавь на главный экран для быстрого доступа'
          }
        </div>
      </div>
      {!isIOS && (
        <button onClick={install} style={{
          background: 'var(--accent)', color: '#000', border: 'none',
          borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)'
        }}>
          Установить
        </button>
      )}
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', color: 'var(--text3)',
        cursor: 'pointer', fontSize: 18, padding: 4, flexShrink: 0
      }}>✕</button>
    </div>
  )
}
