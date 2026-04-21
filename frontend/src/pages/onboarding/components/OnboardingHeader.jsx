import React from 'react'

export default function OnboardingHeader({ slogan }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 40 }}>
      <div className="ob-logo">Nutrio</div>
      <p style={{ color: 'var(--text2)', fontSize: 15, margin: 0 }}>{slogan}</p>
    </div>
  )
}
