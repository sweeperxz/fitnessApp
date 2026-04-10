import React from 'react'
import Ring from '../../../components/Ring'

export default function NutritionCard({ data, profile, macros, remaining, t }) {
  return (
    <div className="card today-card" style={{ '--i': 0 }}>
      {!data
        ? (
          <div className="today-nutrition-skeleton">
            <div className="today-nutrition-skeleton-top">
              <div className="skeleton skeleton-circle" style={{ width: 118, height: 118, flexShrink: 0 }} />
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
            <div className="today-nutrition-main">
              <Ring eaten={data.total_calories} goal={profile.calories_goal} />
              <div className="today-nutrition-macros">
                {macros.map(m => (
                  <div key={m.l} className="macro-row">
                    <div className="macro-head">
                      <span className="macro-name">{m.l}</span>
                      <span className="macro-val">{Math.round(m.v)}<span>/{m.g}г</span></span>
                    </div>
                    <div className="macro-track">
                      <div
                        className="macro-fill"
                        style={{ '--fill-w': `${Math.min((m.v / m.g) * 100, 100)}%`, background: m.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="today-nutrition-stats">
              {[
                { l: t('today.eaten'), v: Math.round(data.total_calories), c: 'var(--blue2)' },
                { l: t('today.goal'), v: profile.calories_goal, c: 'var(--text)' },
                { l: t('today.remaining'), v: remaining, c: remaining === 0 ? 'var(--red)' : 'var(--green)' },
              ].map(s => (
                <div key={s.l} className="today-kpi">
                  <div className="today-kpi-label">{s.l}</div>
                  <div className="today-kpi-value" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          </>
        )}
    </div>
  )
}
