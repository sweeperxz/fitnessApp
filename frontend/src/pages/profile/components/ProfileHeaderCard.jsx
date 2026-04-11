import React from 'react'

export default function ProfileHeaderCard({ user, t }) {
  if (!user) return null

  return (
    <div className="card profile-user-card">
      <div className="profile-user-avatar">
        {user.name ? user.name[0].toUpperCase() : 'U'}
      </div>

      <div className="profile-user-meta">
        <div className="profile-user-name">{user.name || t('profile.user')}</div>
        <div className="profile-user-email">{user.email}</div>
      </div>
    </div>
  )
}
