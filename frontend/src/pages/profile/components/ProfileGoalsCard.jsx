import React from 'react'

export default function ProfileGoalsCard({ form, goals, acts, calculating, onUpdate, onSelectGoal, onSelectActivity, onRecalculate, t }) {
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
        disabled={calculating}
        className="profile-recalc-btn"
      >
        {calculating ? t('common.loading') || 'Расчет...' : t('profile.recalculate')}
      </button>
    </div>
  )
}
