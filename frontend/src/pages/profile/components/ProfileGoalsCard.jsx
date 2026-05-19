import React from 'react'

export default function ProfileGoalsCard({
  form,
  goals,
  acts,
  genders,
  calculating,
  canCalculate,
  onUpdate,
  onSelectGoal,
  onSelectActivity,
  onSelectGender,
  onRecalculate,
  t,
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card-label" style={{ marginBottom: 0 }}>{t('profile.main_data')}</div>

      {/* Сетка параметров 3x1 */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('profile.weight')} (кг)</div>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={form.weight}
            onChange={e => onUpdate('weight', e.target.value)}
            style={{ padding: '8px 10px' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('onboarding.steps.params.height')} (см)</div>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.height}
            onChange={e => onUpdate('height', e.target.value)}
            placeholder="—"
            style={{ padding: '8px 10px' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('onboarding.steps.params.age')} (лет)</div>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.age}
            onChange={e => onUpdate('age', e.target.value)}
            placeholder="—"
            style={{ padding: '8px 10px' }}
          />
        </div>
      </div>

      {/* Выбор пола (Сегментный контроллер) */}
      {genders && (
        <div>
          <div className="input-label">{t('onboarding.steps.gender.title')}</div>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '12px', padding: 3, border: '1px solid var(--border)' }}>
            {genders.map(g => (
              <button
                key={g.v}
                type="button"
                onClick={() => onSelectGender?.(g.v)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  background: form.gender === g.v ? 'var(--bg2)' : 'transparent',
                  color: form.gender === g.v ? 'var(--text)' : 'var(--text2)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.2s',
                  boxShadow: form.gender === g.v ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                {t(g.lKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор цели (Сегментный контроллер) */}
      <div>
        <div className="input-label">{t('profile.goal')}</div>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '12px', padding: 3, border: '1px solid var(--border)' }}>
          {goals.map(goal => (
            <button
              key={goal.v}
              type="button"
              onClick={() => onSelectGoal(goal.v)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: form.goal === goal.v ? 'var(--bg2)' : 'transparent',
                color: form.goal === goal.v ? 'var(--blue2)' : 'var(--text2)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: '0.2s',
                boxShadow: form.goal === goal.v ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {t(goal.lKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Выбор активности (Сегментный контроллер) */}
      <div>
        <div className="input-label">{t('profile.activity')}</div>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '12px', padding: 3, border: '1px solid var(--border)' }}>
          {acts.map(activity => (
            <button
              key={activity.v}
              type="button"
              onClick={() => onSelectActivity(activity.v)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: form.activity === activity.v ? 'var(--bg2)' : 'transparent',
                color: form.activity === activity.v ? 'var(--text)' : 'var(--text2)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: '0.2s',
                boxShadow: form.activity === activity.v ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {t(activity.lKey)}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRecalculate}
        disabled={calculating || canCalculate === false}
        style={{
          width: '100%',
          padding: '11px 0',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          background: 'rgba(59, 130, 246, 0.08)',
          color: 'var(--blue2)',
          fontFamily: 'var(--font)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.2s',
          opacity: canCalculate === false ? 0.5 : 1,
        }}
      >
        {calculating ? (
          <div style={{ width: 14, height: 14, border: '2px solid var(--blue2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <path d="M9 9h6M9 13h6M9 17h6" />
          </svg>
        )}
        {calculating ? t('common.loading') : t('profile.recalculate')}
      </button>
    </div>
  )
}
