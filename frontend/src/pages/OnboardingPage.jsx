import React, { useState } from 'react'
import { upsertProfile } from '../api'

const STEPS = 5

function calcGoals({ age, weight, height, gender, activity, goal }) {
  const w = +weight, h = +height, a = +age
  const bmr = gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
  const mult = { low: 1.2, medium: 1.55, high: 1.725 }[activity] || 1.55
  let kcal = bmr * mult
  if (goal === 'lose') kcal -= 400
  if (goal === 'gain') kcal += 300
  const protein = Math.round(w * 2), fat = Math.round(w * 1)
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 50)
  return { calories_goal: Math.round(kcal), protein_goal: protein, fat_goal: fat, carbs_goal: carbs, water_goal: Math.round(w * 30) }
}

const MIcon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>

export default function OnboardingPage({ onDone }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ gender: '', age: '', weight: '', height: '', goal: '', activity: '' })
  const [loading, setLoading] = useState(false)
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }))
  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const finish = async () => {
    setLoading(true)
    try { await upsertProfile({ weight: +data.weight, goal: data.goal, activity: data.activity, ...calcGoals(data) }); onDone() }
    catch (e) { console.error(e) }
    setLoading(false)
  }

  const GENDER_OPTS = [
    { v: 'male', label: 'Мужской', icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z' },
    { v: 'female', label: 'Женский', icon: 'M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z' },
  ]
  const GOAL_OPTS = [
    { v: 'lose', label: 'Похудение', desc: 'Снижение жира, дефицит калорий', icon: 'M12 19V5M5 12l7-7 7 7' },
    { v: 'maintain', label: 'Поддержание', desc: 'Сохранить текущую форму', icon: 'M5 12h14' },
    { v: 'gain', label: 'Набор массы', desc: 'Рост мышц, профицит калорий', icon: 'M12 5v14M5 12l7 7 7-7' },
  ]
  const ACTIVITY_OPTS = [
    { v: 'low', label: 'Низкая', desc: 'Без спорта', icon: 'M16 18l2-6-6 2-2 6 6-2z' },
    { v: 'medium', label: 'Средняя', desc: '1–3 трени/нед', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    { v: 'high', label: 'Высокая', desc: '4+ трени/нед', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  ]

  return (
    <div className="onboard-wrap fade-in">
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 40 }}>
        <div className="ob-logo">Nutrio</div>
        <p style={{ color: 'var(--text2)', fontSize: 15, margin: 0 }}>
          Твой умный дневник питания
        </p>
      </div>

      <div className="ob-prog">
        {Array.from({ length: STEPS }, (_, i) => <div key={i} className={`ob-dot ${i <= step ? 'done' : ''}`} />)}
      </div>

      {step === 0 && <>
        <div className="ob-step">Шаг 1 / 5</div>
        <div className="ob-title">Выбери пол</div>
        <div className="ob-desc">Влияет на расчёт базового метаболизма</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {GENDER_OPTS.map(g => (
            <div key={g.v} className={`ob-card ${data.gender === g.v ? 'active' : ''}`} onClick={() => upd('gender', g.v)} style={{ flexDirection: 'column', textAlign: 'center', padding: '20px 12px' }}>
              <div className="ob-card-icon" style={{ margin: '0 auto 10px' }}><MIcon d={g.icon} /></div>
              <div className="ob-card-title">{g.label}</div>
            </div>
          ))}
        </div>
        <div className="ob-footer"><button className="btn-primary" onClick={next} disabled={!data.gender}>Далее</button></div>
      </>}

      {step === 1 && <>
        <div className="ob-step">Шаг 2 / 5</div>
        <div className="ob-title">Параметры тела</div>
        <div className="ob-desc">Для точного расчёта КБЖУ и нормы воды</div>
        {[{ k: 'age', l: 'Возраст', ph: '25', t: 'numeric' }, { k: 'height', l: 'Рост (см)', ph: '175', t: 'numeric' }, { k: 'weight', l: 'Вес (кг)', ph: '75', t: 'decimal' }].map(f => (
          <div className="form-group" key={f.k}><div className="input-label">{f.l}</div><input className="input" type="number" inputMode={f.t} placeholder={f.ph} value={data[f.k]} onChange={e => upd(f.k, e.target.value)} /></div>
        ))}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>←</button>
          <button className="btn-primary" onClick={next} disabled={!data.age || !data.height || !data.weight}>Далее</button>
        </div>
      </>}

      {step === 2 && <>
        <div className="ob-step">Шаг 3 / 5</div>
        <div className="ob-title">Твоя цель</div>
        <div className="ob-desc">Определяет калорийность рациона</div>
        {GOAL_OPTS.map(g => (
          <div key={g.v} className={`ob-card ${data.goal === g.v ? 'active' : ''}`} onClick={() => upd('goal', g.v)}>
            <div className="ob-card-icon"><MIcon d={g.icon} /></div>
            <div><div className="ob-card-title">{g.label}</div><div className="ob-card-desc">{g.desc}</div></div>
          </div>
        ))}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>←</button>
          <button className="btn-primary" onClick={next} disabled={!data.goal}>Далее</button>
        </div>
      </>}

      {step === 3 && <>
        <div className="ob-step">Шаг 4 / 5</div>
        <div className="ob-title">Уровень активности</div>
        <div className="ob-desc">Учитывает физическую нагрузку за неделю</div>
        {ACTIVITY_OPTS.map(a => (
          <div key={a.v} className={`ob-card ${data.activity === a.v ? 'active' : ''}`} onClick={() => upd('activity', a.v)}>
            <div className="ob-card-icon"><MIcon d={a.icon} /></div>
            <div><div className="ob-card-title">{a.label}</div><div className="ob-card-desc">{a.desc}</div></div>
          </div>
        ))}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>←</button>
          <button className="btn-primary" onClick={next} disabled={!data.activity}>Далее</button>
        </div>
      </>}

      {step === 4 && (() => {
        const goals = data.weight && data.age && data.height ? calcGoals(data) : null
        return <>
          <div className="ob-step">Шаг 5 / 5</div>
          <div className="ob-title">Всё готово</div>
          <div className="ob-desc">Персональные цели на основе твоих данных:</div>
          {goals && (
            <div className="card" style={{ marginBottom: 24 }}>
              {[{ l: 'Калории', v: goals.calories_goal + ' ккал/день', c: 'var(--accent)' }, { l: 'Белки', v: goals.protein_goal + 'г', c: 'var(--accent2)' }, { l: 'Жиры', v: goals.fat_goal + 'г', c: 'var(--yellow)' }, { l: 'Углеводы', v: goals.carbs_goal + 'г', c: 'var(--accent3)' }, { l: 'Вода', v: goals.water_goal + ' мл', c: 'var(--text)' }].map(r => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontSize: 14 }}>{r.l}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ob-footer">
            <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>←</button>
            <button className="btn-primary" onClick={finish} disabled={loading}>{loading ? 'Сохраняем...' : 'Начать'}</button>
          </div>
        </>
      })()}
    </div>
  )
}
