import React from 'react'

export default function AuthBrand({ slogan }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: 'var(--text)', marginBottom: 4 }}>
        Nut<span style={{ color: 'var(--blue2)' }}>rio</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{slogan}</div>
    </div>
  )
}
