import React, { useState, useEffect } from 'react'

export default function Ring({ eaten, goal }) {
    const [anim, setAnim] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setAnim(eaten), 60)
        return () => clearTimeout(t)
    }, [eaten])

    const r = 52, circ = 2 * Math.PI * r
    const ratio = goal > 0 ? anim / goal : 0
    const dash = Math.min(ratio, 1) * circ
    const color = ratio >= 1 ? '#ef4444' : ratio > 0.85 ? '#f59e0b' : '#3b82f6'

    return (
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg4)" strokeWidth="8" />
                <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1), stroke 0.3s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{Math.round(eaten)}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3 }}>из {goal}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>ккал</div>
            </div>
        </div>
    )
}
