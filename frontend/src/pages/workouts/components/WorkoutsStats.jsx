import React from 'react'

export default function WorkoutsStats({ workoutsCount, totalSets, totalTons, countLabel, setsLabel, volumeLabel }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {[
        { v: workoutsCount, l: countLabel },
        { v: totalSets, l: setsLabel },
        { v: totalTons, l: volumeLabel },
      ].map(s => (
        <div key={s.l} className="card" style={{ margin: 0, flex: 1, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)' }}>{s.v}</div>
          <div style={{ marginTop: 3, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text2)' }}>{s.l}</div>
        </div>
      ))}
    </div>
  )
}
