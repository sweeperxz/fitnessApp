import React from 'react'

export default function ProfileMacrosCard({ form, onUpdate, t }) {
  return (
    <div className="card">
      <div className="card-label">{t('profile.macros_goals')}</div>

      <div className="input-row">
        <div>
          <div className="input-label">{t('today.calories')}</div>
          <input className="input" type="number" min="0" value={form.calories_goal} onChange={e => onUpdate('calories_goal', +e.target.value)} />
        </div>
        <div>
          <div className="input-label">{t('today.protein')} г</div>
          <input className="input" type="number" min="0" value={form.protein_goal} onChange={e => onUpdate('protein_goal', +e.target.value)} />
        </div>
      </div>

      <div className="input-row">
        <div>
          <div className="input-label">{t('today.fat')} г</div>
          <input className="input" type="number" min="0" value={form.fat_goal} onChange={e => onUpdate('fat_goal', +e.target.value)} />
        </div>
        <div>
          <div className="input-label">{t('today.carbs')} г</div>
          <input className="input" type="number" min="0" value={form.carbs_goal} onChange={e => onUpdate('carbs_goal', +e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <div className="input-label">{t('today.water')} (мл)</div>
        <input className="input" type="number" min="0" value={form.water_goal} onChange={e => onUpdate('water_goal', +e.target.value)} />
      </div>
    </div>
  )
}
