export const STEPS = 5

export function getGenderOptions(t) {
  return [
    { v: 'male', label: t('onboarding.steps.gender.male'), icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z' },
    { v: 'female', label: t('onboarding.steps.gender.female'), icon: 'M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z' },
  ]
}

export function getGoalOptions(t) {
  return [
    { v: 'lose', label: t('onboarding.steps.goal.lose'), desc: t('onboarding.steps.goal.lose_desc'), icon: 'M12 19V5M5 12l7-7 7 7' },
    { v: 'maintain', label: t('onboarding.steps.goal.maintain'), desc: t('onboarding.steps.goal.maintain_desc'), icon: 'M5 12h14' },
    { v: 'gain', label: t('onboarding.steps.goal.gain'), desc: t('onboarding.steps.goal.gain_desc'), icon: 'M12 5v14M5 12l7 7 7-7' },
  ]
}

export function getActivityOptions(t) {
  return [
    { v: 'low', label: t('onboarding.steps.activity.low'), desc: t('onboarding.steps.activity.low_desc'), icon: 'M16 18l2-6-6 2-2 6 6-2z' },
    { v: 'medium', label: t('onboarding.steps.activity.medium'), desc: t('onboarding.steps.activity.medium_desc'), icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    { v: 'high', label: t('onboarding.steps.activity.high'), desc: t('onboarding.steps.activity.high_desc'), icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  ]
}

export const PARAM_FIELDS = [
  { k: 'age', t: 'numeric', min: 10, max: 120, ph: '25' },
  { k: 'height', t: 'numeric', min: 100, max: 250, ph: '175' },
  { k: 'weight', t: 'decimal', min: 30, max: 300, ph: '75' },
]
