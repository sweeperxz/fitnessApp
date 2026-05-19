import React from 'react'
import Ring from '../../../components/Ring'

export default function NutritionCard({ data, profile, macros, remaining, t }) {
  return (
    <div className="card today-card" style={{ '--i': 0, padding: '20px' }}>
      {!data ? (
        <div className="today-nutrition-skeleton">
          <div className="today-nutrition-skeleton-top">
            <div className="skeleton skeleton-circle" style={{ height: 118, width: 118, flexShrink: 0 }} />
            <div className="today-nutrition-skeleton-macros">
              <div className="skeleton skeleton-line" style={{ width: '80%' }} />
              <div className="skeleton skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton skeleton-line" style={{ width: '70%' }} />
            </div>
          </div>
          <div className="skeleton skeleton-line" style={{ height: 16, width: '100%' }} />
        </div>
      ) : (
        <>
          <div className="today-nutrition-main" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Анимированное кольцо калорий с тенью */}
            <div style={{ filter: 'drop-shadow(0 4px 10px rgba(59, 130, 246, 0.15))' }}>
              <Ring eaten={data.total_calories} goal={profile.calories_goal} />
            </div>

            {/* Макронутриенты */}
            <div className="today-nutrition-macros" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {macros.map(m => {
                const pct = Math.min((m.v / m.g) * 100, 100)
                return (
                  <div key={m.l} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.c, display: 'inline-block' }} />
                        {m.l}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
                        {Math.round(m.v)}<span style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 600 }}>/{m.g}г</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: m.c,
                          borderRadius: 3,
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Информационные плашки KPI */}
          <div className="today-nutrition-stats" style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
          }}>
            {[
              { l: t('today.eaten'), v: Math.round(data.total_calories), c: 'var(--text)' },
              { l: t('today.goal'), v: profile.calories_goal, c: 'var(--text3)' },
              { l: t('today.remaining'), v: remaining, c: remaining === 0 ? 'var(--red)' : 'var(--green)' },
            ].map((s, idx) => (
              <div
                key={s.l}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: idx === 2 ? (remaining === 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(34, 197, 94, 0.06)') : 'var(--bg3)',
                  border: `1px solid ${idx === 2 ? (remaining === 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)') : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '8px 4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>{s.l}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.c, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
