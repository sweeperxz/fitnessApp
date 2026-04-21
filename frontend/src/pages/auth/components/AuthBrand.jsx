import React from 'react'

export default function AuthBrand({ slogan }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
        Nut<span style={{ color: 'var(--blue)' }}>rio</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{slogan}</div>
    </div>
  )
}
