import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { upsertProfile } from '../api'
import api from '../api'
import { useFormValidation } from '../hooks/useFormValidation'

const STEPS = 5

const MIcon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>

export default function OnboardingPage({ onDone }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previewGoals, setPreviewGoals] = useState(null)

  const validationRules = useMemo(() => ({
    age: { type: 'number', params: [10, 120] },
    height: { type: 'number', params: [100, 250] },
    weight: { type: 'number', params: [30, 300] }
  }), [])

  const {
    values: data,
    errors: fieldErrors,
    touched,
    setValue,
    setFieldTouched,
    isValid
  } = useFormValidation(
    { gender: '', age: '', weight: '', height: '', goal: '', activity: '' },
    validationRules
  )

  const upd = useCallback((k, v) => setValue(k, v), [setValue])
  const next = useCallback(() => setStep(s => s + 1), [])
  const back = useCallback(() => setStep(s => s - 1), [])

  // Load preview goals when reaching final step
  useEffect(() => {
    if (step === 4 && data.weight && data.height && data.age && data.gender && data.goal && data.activity) {
      const loadPreview = async () => {
        try {
          const { data: goals } = await api.post('/profile/calculate-goals', {
            weight: +data.weight,
            height: +data.height,
            age: +data.age,
            gender: data.gender,
            goal: data.goal,
            activity: data.activity
          })
          setPreviewGoals(goals)
        } catch (e) {
          console.error('Failed to load preview:', e)
        }
      }
      loadPreview()
    }
  }, [step, data.weight, data.height, data.age, data.gender, data.goal, data.activity])

  const finish = useCallback(async () => {
    setLoading(true)
    try {
      // Расчет целей через backend API
      const { data: goals } = await api.post('/profile/calculate-goals', {
        weight: +data.weight,
        height: +data.height,
        age: +data.age,
        gender: data.gender,
        goal: data.goal,
        activity: data.activity
      })

      // Сохранение профиля с рассчитанными целями
      await upsertProfile({
        weight: +data.weight,
        goal: data.goal,
        activity: data.activity,
        ...goals
      })

      onDone()
    } catch (e) {
      console.error('Onboarding failed:', e)
      alert('Ошибка при сохранении профиля')
    }
    setLoading(false)
  }, [data, onDone])

  const GENDER_OPTS = [
    { v: 'male', label: t('onboarding.steps.gender.male'), icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z' },
    { v: 'female', label: t('onboarding.steps.gender.female'), icon: 'M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z' },
  ]
  const GOAL_OPTS = [
    { v: 'lose', label: t('onboarding.steps.goal.lose'), desc: t('onboarding.steps.goal.lose_desc'), icon: 'M12 19V5M5 12l7-7 7 7' },
    { v: 'maintain', label: t('onboarding.steps.goal.maintain'), desc: t('onboarding.steps.goal.maintain_desc'), icon: 'M5 12h14' },
    { v: 'gain', label: t('onboarding.steps.goal.gain'), desc: t('onboarding.steps.goal.gain_desc'), icon: 'M12 5v14M5 12l7 7 7-7' },
  ]
  const ACTIVITY_OPTS = [
    { v: 'low', label: t('onboarding.steps.activity.low'), desc: t('onboarding.steps.activity.low_desc'), icon: 'M16 18l2-6-6 2-2 6 6-2z' },
    { v: 'medium', label: t('onboarding.steps.activity.medium'), desc: t('onboarding.steps.activity.medium_desc'), icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    { v: 'high', label: t('onboarding.steps.activity.high'), desc: t('onboarding.steps.activity.high_desc'), icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  ]

  return (
    <div className="onboard-wrap fade-in">
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 40 }}>
        <div className="ob-logo">Nutrio</div>
        <p style={{ color: 'var(--text2)', fontSize: 15, margin: 0 }}>
          {t('onboarding.slogan')}
        </p>
      </div>

      <div className="ob-prog">
        {Array.from({ length: STEPS }, (_, i) => <div key={i} className={`ob-dot ${i <= step ? 'done' : ''}`} />)}
      </div>

      {step === 0 && <>
        <div className="ob-step">{t('onboarding.prog_step', { curr: 1, total: 5 })}</div>
        <div className="ob-title">{t('onboarding.steps.gender.title')}</div>
        <div className="ob-desc">{t('onboarding.steps.gender.desc')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {GENDER_OPTS.map(g => (
            <div key={g.v} className={`ob-card ${data.gender === g.v ? 'active' : ''}`} onClick={() => upd('gender', g.v)} style={{ flexDirection: 'column', textAlign: 'center', padding: '20px 12px' }}>
              <div className="ob-card-icon" style={{ margin: '0 auto 10px' }}><MIcon d={g.icon} /></div>
              <div className="ob-card-title">{g.label}</div>
            </div>
          ))}
        </div>
        <div className="ob-footer"><button className="btn-primary" onClick={next} disabled={!data.gender}>{t('onboarding.footer.next')}</button></div>
      </>}

      {step === 1 && <>
        <div className="ob-step">{t('onboarding.prog_step', { curr: 2, total: 5 })}</div>
        <div className="ob-title">{t('onboarding.steps.params.title')}</div>
        <div className="ob-desc">{t('onboarding.steps.params.desc')}</div>
        {[
          { k: 'age', l: t('onboarding.steps.params.age'), ph: '25', t: 'numeric', min: 10, max: 120 },
          { k: 'height', l: t('onboarding.steps.params.height'), ph: '175', t: 'numeric', min: 100, max: 250 },
          { k: 'weight', l: t('onboarding.steps.params.weight'), ph: '75', t: 'decimal', min: 30, max: 300 }
        ].map(f => (
          <div className="form-group" key={f.k}>
            <div className="input-label">{f.l}</div>
            <input
              className="input"
              type="number"
              inputMode={f.t}
              placeholder={f.ph}
              value={data[f.k]}
              onChange={e => upd(f.k, e.target.value)}
              onBlur={() => setFieldTouched(f.k)}
              style={touched[f.k] && fieldErrors[f.k] ? { borderColor: 'var(--red)' } : {}}
            />
            {touched[f.k] && fieldErrors[f.k] && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{fieldErrors[f.k]}</div>
            )}
          </div>
        ))}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>{t('onboarding.footer.back')}</button>
          <button className="btn-primary" onClick={next} disabled={!isValid || !data.age || !data.height || !data.weight}>{t('onboarding.footer.next')}</button>
        </div>
      </>}

      {step === 2 && <>
        <div className="ob-step">{t('onboarding.prog_step', { curr: 3, total: 5 })}</div>
        <div className="ob-title">{t('onboarding.steps.goal.title')}</div>
        <div className="ob-desc">{t('onboarding.steps.goal.desc')}</div>
        {GOAL_OPTS.map(g => (
          <div key={g.v} className={`ob-card ${data.goal === g.v ? 'active' : ''}`} onClick={() => upd('goal', g.v)}>
            <div className="ob-card-icon"><MIcon d={g.icon} /></div>
            <div><div className="ob-card-title">{g.label}</div><div className="ob-card-desc">{g.desc}</div></div>
          </div>
        ))}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>{t('onboarding.footer.back')}</button>
          <button className="btn-primary" onClick={next} disabled={!data.goal}>{t('onboarding.footer.next')}</button>
        </div>
      </>}

      {step === 3 && <>
        <div className="ob-step">{t('onboarding.prog_step', { curr: 4, total: 5 })}</div>
        <div className="ob-title">{t('onboarding.steps.activity.title')}</div>
        <div className="ob-desc">{t('onboarding.steps.activity.desc')}</div>
        {ACTIVITY_OPTS.map(a => (
          <div key={a.v} className={`ob-card ${data.activity === a.v ? 'active' : ''}`} onClick={() => upd('activity', a.v)}>
            <div className="ob-card-icon"><MIcon d={a.icon} /></div>
            <div><div className="ob-card-title">{a.label}</div><div className="ob-card-desc">{a.desc}</div></div>
          </div>
        ))}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>{t('onboarding.footer.back')}</button>
          <button className="btn-primary" onClick={next} disabled={!data.activity}>{t('onboarding.footer.next')}</button>
        </div>
      </>}

      {step === 4 && <>
        <div className="ob-step">{t('onboarding.prog_step', { curr: 5, total: 5 })}</div>
        <div className="ob-title">{t('onboarding.steps.finish.title')}</div>
        <div className="ob-desc">{t('onboarding.steps.finish.desc')}</div>
        {previewGoals && (
          <div className="card" style={{ marginBottom: 24 }}>
            {[
              { l: t('today.calories'), v: previewGoals.calories_goal + ' ' + t('onboarding.steps.finish.cal_unit'), c: 'var(--blue)' },
              { l: t('today.protein'), v: previewGoals.protein_goal + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'), c: 'var(--purple)' },
              { l: t('today.fat'), v: previewGoals.fat_goal + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'), c: 'var(--amber)' },
              { l: t('today.carbs'), v: previewGoals.carbs_goal + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'), c: 'var(--green)' },
              { l: t('today.water'), v: previewGoals.water_goal + ' ' + t('today.ml'), c: 'var(--text)' }
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text2)', fontSize: 14 }}>{r.l}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
        <div className="ob-footer">
          <button className="btn-outline" onClick={back} style={{ flex: '0 0 52px' }}>{t('onboarding.footer.back')}</button>
          <button className="btn-primary" onClick={finish} disabled={loading}>{loading ? t('onboarding.steps.finish.save') : t('onboarding.steps.finish.start')}</button>
        </div>
      </>}
    </div>
  )
}
