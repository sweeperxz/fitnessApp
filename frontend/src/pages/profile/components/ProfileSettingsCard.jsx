import React from 'react'

const REGION_OPTIONS = ['default', 'ua', 'us', 'uk', 'fr', 'de', 'it', 'es', 'ca', 'au', 'nz', 'ie', 'in', 'sg', 'za']

export default function ProfileSettingsCard({
  themeMode,
  language,
  fatsecretRegion,
  onThemeToggle,
  onLanguageChange,
  onFatsecretRegionChange,
  pushSupported,
  isSubscribed,
  onPushToggle,
  onTestPush,
  email,
  onLogout,
  t,
}) {
  const isLight = themeMode === 'light'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* ГРУППА 1: НАСТРОЙКИ И ПРЕДПОЧТЕНИЯ */}
      <div className="profile-settings-group">
        <div className="profile-settings-group-title">{t('profile.appearance')}</div>
        
        {/* Тема */}
        <div className="profile-settings-row profile-setting-clickable" onClick={onThemeToggle}>
          <span className="profile-settings-label">{t('profile.theme')}</span>
          <div className="profile-settings-value">
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isLight ? t('profile.theme_light') : t('profile.theme_dark')}
            </span>
            <div className={`profile-switch${isLight ? ' is-on' : ''}`}>
              <div className={`profile-switch-knob${isLight ? ' is-on' : ''}`} />
            </div>
          </div>
        </div>

        {/* Язык */}
        <div className="profile-settings-row">
          <span className="profile-settings-label">{t('profile.language')}</span>
          <div className="profile-settings-value">
            <select
              className="profile-language-select"
              value={language}
              onChange={e => onLanguageChange(e.target.value)}
              style={{ border: 'none', padding: '4px 6px', background: 'var(--bg3)', borderRadius: 6, fontWeight: 700 }}
            >
              <option value="en">English</option>
              <option value="uk">Українська</option>
            </select>
          </div>
        </div>

        {/* Регион FatSecret */}
        <div className="profile-settings-row">
          <span className="profile-settings-label">{t('profile.fatsecret_region')}</span>
          <div className="profile-settings-value">
            <select
              className="profile-language-select"
              value={fatsecretRegion}
              onChange={e => onFatsecretRegionChange(e.target.value)}
              style={{ border: 'none', padding: '4px 6px', background: 'var(--bg3)', borderRadius: 6, fontWeight: 700, maxWidth: 150 }}
            >
              {REGION_OPTIONS.map(region => (
                <option key={region} value={region}>{t(`profile.fatsecret_region_${region}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Уведомления */}
        {pushSupported && (
          <>
            <div className="profile-settings-row profile-setting-clickable" onClick={onPushToggle}>
              <span className="profile-settings-label">{t('profile.push')}</span>
              <div className="profile-settings-value">
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {isSubscribed ? t('profile.push_on') : t('profile.push_off')}
                </span>
                <div className={`profile-switch${isSubscribed ? ' is-on' : ''}`}>
                  <div className={`profile-switch-knob${isSubscribed ? ' is-on' : ''}`} />
                </div>
              </div>
            </div>

            {isSubscribed && (
              <div className="profile-settings-row profile-setting-clickable" onClick={onTestPush}>
                <span className="profile-settings-label" style={{ color: 'var(--blue2)' }}>{t('profile.test_push')}</span>
                <div className="profile-settings-value">
                  <svg className="profile-arrow profile-arrow--blue" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2.5} strokeLinecap="round" style={{ width: 16, height: 16 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ГРУППА 2: АККАУНТ И О ПРИЛОЖЕНИИ */}
      <div className="profile-settings-group">
        <div className="profile-settings-group-title">{t('profile.account')}</div>

        {/* Email */}
        {email && (
          <div className="profile-settings-row">
            <span className="profile-settings-label">Email</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{email}</span>
          </div>
        )}

        {/* Версия */}
        <div className="profile-settings-row">
          <span className="profile-settings-label">{t('profile.version')}</span>
          <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>2.0 PWA</span>
        </div>

        {/* База продуктов */}
        <div className="profile-settings-row">
          <span className="profile-settings-label">{t('profile.db')}</span>
          <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>FatSecret + Local DB</span>
        </div>

        {/* ИИ Движок */}
        <div className="profile-settings-row">
          <span className="profile-settings-label">{t('profile.ai_engine')}</span>
          <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>Gemini Pro API</span>
        </div>

        {/* Выход из системы */}
        <div className="profile-settings-row profile-setting-clickable" onClick={onLogout}>
          <span className="profile-settings-label" style={{ color: 'var(--red)' }}>{t('common.logout')}</span>
          <div className="profile-settings-value">
            <svg className="profile-arrow profile-arrow--red" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2.5} strokeLinecap="round" style={{ width: 16, height: 16 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>

    </div>
  )
}
