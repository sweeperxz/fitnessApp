import React from 'react'
import OnboardingIcon from './OnboardingIcon'
import OnboardingStepMeta from './OnboardingStepMeta'
import OnboardingFooter from './OnboardingFooter'

export default function OnboardingGoalStep({ t, options, selectedGoal, onSelectGoal, onBack, onNext }) {
  return (
    <>
      <OnboardingStepMeta
        progressText={t('onboarding.prog_step', { curr: 3, total: 5 })}
        title={t('onboarding.steps.goal.title')}
        description={t('onboarding.steps.goal.desc')}
      />

      {options.map(option => (
        <div key={option.v} className={`ob-card ${selectedGoal === option.v ? 'active' : ''}`} onClick={() => onSelectGoal(option.v)}>
          <div className="ob-card-icon"><OnboardingIcon d={option.icon} /></div>
          <div>
            <div className="ob-card-title">{option.label}</div>
            <div className="ob-card-desc">{option.desc}</div>
          </div>
        </div>
      ))}

      <OnboardingFooter
        backLabel={t('onboarding.footer.back')}
        nextLabel={{ default: t('onboarding.footer.next'), loading: t('onboarding.footer.next') }}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!selectedGoal}
      />
    </>
  )
}
