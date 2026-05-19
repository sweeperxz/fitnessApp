import React from 'react'

export default function AIWelcomeState({ suggestions, onSend, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 16px', paddingBottom: 16 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          {/* Иконка ИИ без градиента */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            border: '1px solid rgba(59, 130, 246, 0.15)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2.5} strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{t('ai_chat.welcome_title')}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('ai_chat.status')}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, lineHeight: 1.5 }}>{t('ai_chat.welcome_text')}</div>
        </div>
        
        {/* Кнопки предложений */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSend(suggestion)}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '12px 16px',
                textAlign: 'left',
                color: 'var(--text2)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                lineHeight: 1.4,
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--blue2)'
                e.currentTarget.style.color = 'var(--text)'
                e.currentTarget.style.background = 'var(--bg3)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text2)'
                e.currentTarget.style.background = 'var(--bg2)'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'
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
