import React from 'react'

export default function AdminHeader({ title }) {
  const parts = title.split(/[\s-]/)
  const left = parts[0]
  const right = parts.slice(1).join(' ')

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 6, flexShrink: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, color: 'var(--text)' }}>
        {left}<span style={{ color: 'var(--blue2)' }}>{right ? ` ${right}` : ''}</span>
      </div>
    </div>
  )
}
