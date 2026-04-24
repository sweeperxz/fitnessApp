import React from 'react'

const REGION_OPTIONS = ['default', 'ua', 'us', 'uk', 'fr', 'de', 'it', 'es', 'ca', 'au', 'nz', 'ie', 'in', 'sg', 'za']

export default function ProfileSettingsCard({
  themeMode,
  language,
  fatsecretRegion,
  onThemeToggle,
  onLanguageChange,
  onFatsecretRegionChange,
  t,
}) {
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

      <div className="setting-row">
        <span className="setting-label">{t('profile.fatsecret_region')}</span>
        <select
          className="profile-language-select"
          value={fatsecretRegion}
          onChange={e => onFatsecretRegionChange(e.target.value)}
        >
          {REGION_OPTIONS.map(region => (
            <option key={region} value={region}>{t(`profile.fatsecret_region_${region}`)}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
