import React from 'react'
import OnboardingStepMeta from './OnboardingStepMeta'
import OnboardingFooter from './OnboardingFooter'

export default function OnboardingFinishStep({ t, previewGoals, onBack, onFinish, loading }) {
  const gramUnit = t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'

  const rows = previewGoals
    ? [
        { l: t('today.calories'), v: `${previewGoals.calories_goal} ${t('onboarding.steps.finish.cal_unit')}`, c: 'var(--blue)' },
        { l: t('today.protein'), v: `${previewGoals.protein_goal}${gramUnit}`, c: 'var(--purple)' },
        { l: t('today.fat'), v: `${previewGoals.fat_goal}${gramUnit}`, c: 'var(--amber)' },
        { l: t('today.carbs'), v: `${previewGoals.carbs_goal}${gramUnit}`, c: 'var(--green)' },
        { l: t('today.water'), v: `${previewGoals.water_goal} ${t('today.ml')}`, c: 'var(--text)' },
      ]
    : []

  return (
    <>
      <OnboardingStepMeta
        progressText={t('onboarding.prog_step', { curr: 5, total: 5 })}
        title={t('onboarding.steps.finish.title')}
        description={t('onboarding.steps.finish.desc')}
      />

      {previewGoals && (
        <div className="card" style={{ marginBottom: 24 }}>
          {rows.map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>{row.l}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: row.c }}>{row.v}</span>
            </div>
          ))}
        </div>
      )}

      <OnboardingFooter
        backLabel={t('onboarding.footer.back')}
        nextLabel={{ default: t('onboarding.steps.finish.start'), loading: t('onboarding.steps.finish.save') }}
        onBack={onBack}
        onNext={onFinish}
        nextLoading={loading}
      />
    </>
  )
}
