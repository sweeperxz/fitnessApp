import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { upsertProfile } from '../api'
import api from '../api'
import { useFormValidation } from '../hooks/useFormValidation'
import { STEPS, getGenderOptions, getGoalOptions, getActivityOptions, PARAM_FIELDS } from './onboarding/constants'
import OnboardingHeader from './onboarding/components/OnboardingHeader'
import OnboardingProgress from './onboarding/components/OnboardingProgress'
import OnboardingGenderStep from './onboarding/components/OnboardingGenderStep'
import OnboardingParamsStep from './onboarding/components/OnboardingParamsStep'
import OnboardingGoalStep from './onboarding/components/OnboardingGoalStep'
import OnboardingActivityStep from './onboarding/components/OnboardingActivityStep'
import OnboardingFinishStep from './onboarding/components/OnboardingFinishStep'

export default function OnboardingPage({ onDone }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previewGoals, setPreviewGoals] = useState(null)

  const validationRules = useMemo(
    () => ({
      age: { type: 'number', params: [10, 120] },
      height: { type: 'number', params: [100, 250] },
      weight: { type: 'number', params: [30, 300] },
    }),
    [],
  )

  const { values: data, errors: fieldErrors, touched, setValue, setFieldTouched, isValid } = useFormValidation(
    { gender: '', age: '', weight: '', height: '', goal: '', activity: '' },
    validationRules,
  )

  const genderOptions = useMemo(() => getGenderOptions(t), [t])
  const goalOptions = useMemo(() => getGoalOptions(t), [t])
  const activityOptions = useMemo(() => getActivityOptions(t), [t])

  const upd = useCallback((key, value) => setValue(key, value), [setValue])
  const next = useCallback(() => setStep(s => s + 1), [])
  const back = useCallback(() => setStep(s => s - 1), [])

  useEffect(() => {
    if (step !== 4 || !data.weight || !data.height || !data.age || !data.gender || !data.goal || !data.activity) return

    const loadPreview = async () => {
      try {
        const { data: goals } = await api.post('/profile/calculate-goals', {
          weight: +data.weight,
          height: +data.height,
          age: +data.age,
          gender: data.gender,
          goal: data.goal,
          activity: data.activity,
        })
        setPreviewGoals(goals)
      } catch (e) {
        console.error('Failed to load preview:', e)
      }
    }

    loadPreview()
  }, [step, data.weight, data.height, data.age, data.gender, data.goal, data.activity])

  const finish = useCallback(async () => {
    setLoading(true)
    try {
      const { data: goals } = await api.post('/profile/calculate-goals', {
        weight: +data.weight,
        height: +data.height,
        age: +data.age,
        gender: data.gender,
        goal: data.goal,
        activity: data.activity,
      })

      await upsertProfile({
        weight: +data.weight,
        goal: data.goal,
        activity: data.activity,
        ...goals,
      })

      onDone()
    } catch (e) {
      console.error('Onboarding failed:', e)
      alert('Ошибка при сохранении профиля')
    }
    setLoading(false)
  }, [data, onDone])

  return (
    <div className="onboard-wrap fade-in">
      <OnboardingHeader slogan={t('onboarding.slogan')} />
      <OnboardingProgress total={STEPS} step={step} />

      {step === 0 && (
        <OnboardingGenderStep
          t={t}
          options={genderOptions}
          selectedGender={data.gender}
          onSelectGender={value => upd('gender', value)}
          onNext={next}
        />
      )}

      {step === 1 && (
        <OnboardingParamsStep
          t={t}
          fields={PARAM_FIELDS}
          data={data}
          touched={touched}
          fieldErrors={fieldErrors}
          isValid={isValid}
          onChangeField={upd}
          onBlurField={setFieldTouched}
          onBack={back}
          onNext={next}
        />
      )}

      {step === 2 && (
        <OnboardingGoalStep
          t={t}
          options={goalOptions}
          selectedGoal={data.goal}
          onSelectGoal={value => upd('goal', value)}
          onBack={back}
          onNext={next}
        />
      )}

      {step === 3 && (
        <OnboardingActivityStep
          t={t}
          options={activityOptions}
          selectedActivity={data.activity}
          onSelectActivity={value => upd('activity', value)}
          onBack={back}
          onNext={next}
        />
      )}

      {step === 4 && (
        <OnboardingFinishStep
          t={t}
          previewGoals={previewGoals}
          onBack={back}
          onFinish={finish}
          loading={loading}
        />
      )}
    </div>
  )
}
