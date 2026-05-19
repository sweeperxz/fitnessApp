import React from 'react'

export default function ProfileMacrosCard({ form, onUpdate, t }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card-label" style={{ marginBottom: 0 }}>{t('profile.macros_goals')}</div>

      {/* Ряд 1: Калории и Вода (2 колонки) */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('today.calories')}</div>
          <input className="input" type="number" min="0" value={form.calories_goal} onChange={e => onUpdate('calories_goal', +e.target.value)} style={{ padding: '8px 10px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('today.water')} (мл)</div>
          <input className="input" type="number" min="0" value={form.water_goal} onChange={e => onUpdate('water_goal', +e.target.value)} style={{ padding: '8px 10px' }} />
        </div>
      </div>

      {/* Ряд 2: Белки, Жиры, Углеводы (3 колонки) */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('today.protein')} (г)</div>
          <input className="input" type="number" min="0" value={form.protein_goal} onChange={e => onUpdate('protein_goal', +e.target.value)} style={{ padding: '8px 10px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('today.fat')} (г)</div>
          <input className="input" type="number" min="0" value={form.fat_goal} onChange={e => onUpdate('fat_goal', +e.target.value)} style={{ padding: '8px 10px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="input-label" style={{ fontSize: 11 }}>{t('today.carbs')} (г)</div>
          <input className="input" type="number" min="0" value={form.carbs_goal} onChange={e => onUpdate('carbs_goal', +e.target.value)} style={{ padding: '8px 10px' }} />
        </div>
      </div>
    </div>
  )
}
