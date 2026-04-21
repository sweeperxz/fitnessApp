import React from 'react'

export default function OnboardingProgress({ total, step }) {
  return (
    <div className="ob-prog">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`ob-dot ${i <= step ? 'done' : ''}`} />
      ))}
    </div>
  )
}
