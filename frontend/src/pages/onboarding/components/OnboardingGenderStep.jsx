import React from 'react'
import OnboardingIcon from './OnboardingIcon'
import OnboardingStepMeta from './OnboardingStepMeta'
import OnboardingFooter from './OnboardingFooter'

export default function OnboardingGenderStep({ t, options, selectedGender, onSelectGender, onNext }) {
  return (
    <>
      <OnboardingStepMeta
        progressText={t('onboarding.prog_step', { curr: 1, total: 5 })}
        title={t('onboarding.steps.gender.title')}
        description={t('onboarding.steps.gender.desc')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {options.map(option => (
          <div
            key={option.v}
            className={`ob-card ${selectedGender === option.v ? 'active' : ''}`}
            onClick={() => onSelectGender(option.v)}
            style={{ flexDirection: 'column', textAlign: 'center', padding: '20px 12px' }}
          >
            <div className="ob-card-icon" style={{ margin: '0 auto 10px' }}>
              <OnboardingIcon d={option.icon} />
            </div>
            <div className="ob-card-title">{option.label}</div>
          </div>
        ))}
      </div>

      <OnboardingFooter
        nextLabel={{ default: t('onboarding.footer.next'), loading: t('onboarding.footer.next') }}
        onNext={onNext}
        nextDisabled={!selectedGender}
      />
    </>
  )
}
