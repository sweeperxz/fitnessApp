import React from 'react'

export default function OnboardingHeader({ slogan }) {
  return (
    <div style={{ margin: '40px 0', textAlign: 'center' }}>
      <div className="ob-logo">Nutrio</div>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text2)' }}>{slogan}</p>
    </div>
  )
}
