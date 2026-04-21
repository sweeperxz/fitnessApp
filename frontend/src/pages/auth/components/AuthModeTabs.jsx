import React from 'react'

export default function AuthModeTabs({ mode, loginLabel, registerLabel, onSwitch }) {
  return (
    <div className="tab-bar" style={{ marginBottom: 16 }}>
      {[
        ['login', loginLabel],
        ['register', registerLabel],
      ].map(([nextMode, label]) => (
        <button
          key={nextMode}
          className={`tab-btn${mode === nextMode ? ' active' : ''}`}
          onClick={() => onSwitch(nextMode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
