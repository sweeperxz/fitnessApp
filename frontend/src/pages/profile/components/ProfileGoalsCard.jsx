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
    <div className="card">
      <div className="card-label">{t('profile.main_data')}</div>

      <div className="form-group">
        <div className="input-label">{t('profile.weight')}</div>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={form.weight}
          onChange={e => onUpdate('weight', e.target.value)}
        />
      </div>

      <div className="form-group">
        <div className="input-label">{t('onboarding.steps.params.height')}</div>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={form.height}
          onChange={e => onUpdate('height', e.target.value)}
          placeholder="—"
        />
      </div>

      <div className="form-group">
        <div className="input-label">{t('onboarding.steps.params.age')}</div>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={form.age}
          onChange={e => onUpdate('age', e.target.value)}
          placeholder="—"
        />
      </div>

      {genders && (
        <div className="form-group">
          <div className="input-label">{t('onboarding.steps.gender.title')}</div>
          <div className="chip-row">
            {genders.map(g => (
              <button
                key={g.v}
                type="button"
                onClick={() => onSelectGender?.(g.v)}
                className={`chip${form.gender === g.v ? ' active' : ''}`}
              >
                {t(g.lKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <div className="input-label">{t('profile.goal')}</div>
        <div className="chip-row">
          {goals.map(goal => (
            <button
              key={goal.v}
              type="button"
              onClick={() => onSelectGoal(goal.v)}
              className={`chip${form.goal === goal.v ? ' active' : ''}`}
            >
              {t(goal.lKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="input-label">{t('profile.activity')}</div>
        <div className="profile-activity-row">
          {acts.map(activity => (
            <button
              key={activity.v}
              type="button"
              onClick={() => onSelectActivity(activity.v)}
              className={`profile-activity-btn${form.activity === activity.v ? ' is-active' : ''}`}
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
        className="profile-recalc-btn"
        title={canCalculate === false ? (t('profile.recalc_missing_data') || 'Заполните рост, возраст и пол') : undefined}
      >
        {calculating ? t('common.loading') || 'Расчет...' : t('profile.recalculate')}
      </button>
    </div>
  )
}
