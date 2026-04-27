import React from 'react'
import OnboardingStepMeta from './OnboardingStepMeta'
import OnboardingFooter from './OnboardingFooter'

export default function OnboardingParamsStep({ t, fields, data, touched, fieldErrors, isValid, onChangeField, onBlurField, onBack, onNext }) {
  return (
    <>
      <OnboardingStepMeta
        progressText={t('onboarding.prog_step', { curr: 2, total: 5 })}
        title={t('onboarding.steps.params.title')}
        description={t('onboarding.steps.params.desc')}
      />

      {fields.map(field => (
        <div className="form-group" key={field.k}>
          <div className="input-label">{t(`onboarding.steps.params.${field.k}`)}</div>
          <input
            className="input"
            type="number"
            inputMode={field.t}
            placeholder={field.ph}
            value={data[field.k]}
            onChange={e => onChangeField(field.k, e.target.value)}
            onBlur={() => onBlurField(field.k)}
            style={touched[field.k] && fieldErrors[field.k] ? { borderColor: 'var(--red)' } : {}}
          />
          {touched[field.k] && fieldErrors[field.k] && (
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--red)' }}>{fieldErrors[field.k]}</div>
          )}
        </div>
      ))}

      <OnboardingFooter
        backLabel={t('onboarding.footer.back')}
        nextLabel={{ default: t('onboarding.footer.next'), loading: t('onboarding.footer.next') }}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!isValid || !data.age || !data.height || !data.weight}
      />
    </>
  )
}
