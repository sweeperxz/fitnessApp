import React from 'react'

export default function WorkoutsStats({ workoutsCount, totalSets, totalTons, countLabel, setsLabel, volumeLabel }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {[
        { v: workoutsCount, l: countLabel },
        { v: totalSets, l: setsLabel },
        { v: totalTons, l: volumeLabel },
      ].map(s => (
        <div key={s.l} className="card" style={{ flex: 1, margin: 0, textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)' }}>{s.v}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.l}</div>
        </div>
      ))}
    </div>
  )
}
