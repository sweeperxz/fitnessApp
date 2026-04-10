import React from 'react'
import { tapHaptic } from '../../../utils/haptic'

export default function AiTipsCard({ tipsOpen, tipsLoading, aiTips, onToggle, t }) {
  return (
    <div className="tips-block today-tips-card">
      <div
        className="tips-header"
        onClick={() => {
          tapHaptic()
          onToggle()
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2} strokeLinecap="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>

        <span className="tips-title today-tips-title">{t('today.ai_tips')}</span>

        {tipsLoading ? (
          <div className="today-tips-spinner" />
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text3)"
            strokeWidth={2.5}
            strokeLinecap="round"
            className={`today-tips-chevron${tipsOpen ? ' is-open' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </div>

      {tipsOpen && (
        <div className="today-tips-content">
          {aiTips ? (
            aiTips.map((tip, i) => (
              <div key={i} className="tips-item today-tips-item">
                <div className="today-tips-dot" />
                {tip}
              </div>
            ))
          ) : tipsLoading ? (
            <div className="today-tips-loading">{t('today.generating_tips')}</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
