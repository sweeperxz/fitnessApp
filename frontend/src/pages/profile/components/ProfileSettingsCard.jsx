import React from 'react'

export default function ProfileSettingsCard({ themeMode, language, onThemeToggle, onLanguageChange, t }) {
  const isLight = themeMode === 'light'

  return (
    <div className="card">
      <div className="card-label">{t('profile.appearance')}</div>

      <div className="setting-row profile-setting-clickable profile-theme-row" onClick={onThemeToggle}>
        <span className="setting-label">{t('profile.theme')}</span>

        <div className="profile-setting-control">
          {isLight ? t('profile.theme_light') : t('profile.theme_dark')}
          <div className={`profile-switch${isLight ? ' is-on' : ''}`}>
            <div className={`profile-switch-knob${isLight ? ' is-on' : ''}`} />
          </div>
        </div>
      </div>

      <div className="setting-row">
        <span className="setting-label">{t('profile.language')}</span>
        <select
          className="profile-language-select"
          value={language}
          onChange={e => onLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="uk">Українська</option>
        </select>
      </div>
    </div>
  )
}
