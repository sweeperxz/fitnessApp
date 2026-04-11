import React from 'react'

export default function ProfileNotificationsCard({ isSubscribed, onToggle, onTestPush, t }) {
  return (
    <div className="card">
      <div className="card-label">{t('profile.notifications')}</div>

      <div className="setting-row profile-setting-clickable" onClick={onToggle}>
        <span className="setting-label">{t('profile.push')}</span>

        <div className="profile-setting-control">
          {isSubscribed ? t('profile.push_on') : t('profile.push_off')}
          <div className={`profile-switch${isSubscribed ? ' is-on' : ''}`}>
            <div className={`profile-switch-knob${isSubscribed ? ' is-on' : ''}`} />
          </div>
        </div>
      </div>

      {isSubscribed && (
        <div className="setting-row profile-setting-clickable profile-test-row" onClick={onTestPush}>
          <span className="setting-label profile-test-label">{t('profile.test_push')}</span>
          <svg className="profile-arrow profile-arrow--blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
