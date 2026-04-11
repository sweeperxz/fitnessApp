import React from 'react'

export default function ProfileAccountCard({ email, onLogout, t }) {
  return (
    <div className="card">
      <div className="card-label">{t('profile.account')}</div>

      <div className="setting-row">
        <span className="setting-label">Email</span>
        <span className="setting-val">{email}</span>
      </div>

      <div className="setting-row profile-setting-clickable" onClick={onLogout}>
        <span className="setting-label profile-logout-label">{t('common.logout')}</span>
        <svg className="profile-arrow profile-arrow--red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  )
}
