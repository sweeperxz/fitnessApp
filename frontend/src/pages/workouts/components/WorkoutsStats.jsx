import React from 'react'

export default function WorkoutsStats({ workoutsCount, totalSets, totalTons, countLabel, setsLabel, volumeLabel }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {[
        { v: workoutsCount, l: countLabel, c: 'var(--blue2)' },
        { v: totalSets, l: setsLabel, c: 'var(--purple)' },
        { v: totalTons, l: volumeLabel, c: 'var(--green)' },
      ].map(s => (
        <div key={s.l} style={{
          margin: 0,
          flex: 1,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '14px 8px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
          <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text3)' }}>{s.l}</div>
        </div>
      ))}
    </div>
  )
}
