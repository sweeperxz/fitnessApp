import React from 'react'

export default function WorkoutsHeader({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 6 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, color: 'var(--text)' }}>
        {title.slice(0, 5)}<span style={{ color: 'var(--blue2)' }}>{title.slice(5)}</span>
      </div>
    </div>
  )
}
