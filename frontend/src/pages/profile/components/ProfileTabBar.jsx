import React from 'react'

export default function ProfileTabBar({ tab, onChange, t }) {
  return (
    <div className="tab-bar profile-tab-bar">
      {[['goals', t('profile.tabs.goals')], ['settings', t('profile.tabs.settings')]].map(([tabKey, label]) => (
        <button
          key={tabKey}
          type="button"
          onClick={() => onChange(tabKey)}
          className={`tab-btn profile-tab-btn${tab === tabKey ? ' active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
