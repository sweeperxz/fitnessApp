import React from 'react'

export default function OnboardingHeader({ slogan }) {
  return (
    <div style={{ margin: '32px 0 24px', textAlign: 'center' }}>
      <div className="ob-logo" style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, color: 'var(--text)' }}>
        Nut<span style={{ color: 'var(--blue2)' }}>rio</span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text2)', fontWeight: 600 }}>{slogan}</p>
    </div>
  )
}
