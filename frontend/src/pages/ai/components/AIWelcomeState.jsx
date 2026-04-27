import React from 'react'

export default function AIWelcomeState({ suggestions, onSend, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingBottom: 16 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, var(--blue2), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t('ai_chat.welcome_title')}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{t('ai_chat.status')}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{t('ai_chat.welcome_text')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSend(suggestion)}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '12px 14px',
                textAlign: 'left',
                color: 'var(--text)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                lineHeight: 1.4,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--blue)'
                e.currentTarget.style.background = 'var(--bg3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg2)'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
