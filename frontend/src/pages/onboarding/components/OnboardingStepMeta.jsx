import React from 'react'

export default function OnboardingStepMeta({ progressText, title, description }) {
  return (
    <>
      <div className="ob-step">{progressText}</div>
      <div className="ob-title">{title}</div>
      <div className="ob-desc">{description}</div>
    </>
  )
}
