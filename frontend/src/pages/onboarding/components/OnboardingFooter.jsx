import React from 'react'

export default function OnboardingFooter({ backLabel, nextLabel, onBack, onNext, backOnly, nextDisabled, nextLoading }) {
  return (
    <div className="ob-footer">
      {onBack && (
        <button className="btn-outline" onClick={onBack} style={{ flex: '0 0 52px' }}>
          {backLabel}
        </button>
      )}
      <button className="btn-primary" onClick={onNext} disabled={nextDisabled || nextLoading}>
        {nextLoading ? nextLabel.loading : nextLabel.default}
      </button>
      {backOnly && null}
    </div>
  )
}
