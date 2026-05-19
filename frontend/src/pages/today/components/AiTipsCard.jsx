import React from 'react'
import { tapHaptic } from '../../../utils/haptic'

export default function AiTipsCard({ tipsOpen, tipsLoading, aiTips, onToggle, t }) {
  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '14px 18px',
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}
      className="today-tips-card"
    >
      <div
        onClick={() => {
          tapHaptic()
          onToggle()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        {/* Чистая иконка ИИ без тяжелых теней */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.1)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2.8} strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>

        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: -0.2,
        }}>
          {t('today.ai_tips')}
        </span>

        {tipsLoading ? (
          <div className="today-tips-spinner" />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text3)"
            strokeWidth={2.5}
            strokeLinecap="round"
            className={`today-tips-chevron${tipsOpen ? ' is-open' : ''}`}
            style={{ transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </div>

      {tipsOpen && (
        <div style={{ marginTop: 12 }}>
          {aiTips ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiTips.map((tip, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    paddingLeft: 18,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--text2)',
                    fontWeight: 600,
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: 4,
                    top: 6,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#8b5cf6',
                  }} />
                  {tip}
                </div>
              ))}
            </div>
          ) : tipsLoading ? (
            <div className="today-tips-loading" style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '8px 0' }}>
              {t('today.generating_tips')}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
