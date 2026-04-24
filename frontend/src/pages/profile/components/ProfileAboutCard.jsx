import React from 'react'

export default function ProfileAboutCard({ t }) {
  return (
    <div className="card">
      <div className="card-label">{t('profile.about')}</div>
      <div className="setting-row"><span className="setting-label">{t('profile.version')}</span><span className="setting-val">2.0 PWA</span></div>
      <div className="setting-row"><span className="setting-label">{t('profile.db')}</span><span className="setting-val">FatSecret</span></div>
      <div className="setting-row"><span className="setting-label">{t('profile.ai_engine')}</span><span className="setting-val">Gemini API</span></div>
    </div>
  )
}
