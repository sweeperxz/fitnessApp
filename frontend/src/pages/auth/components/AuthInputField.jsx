import React from 'react'

export default function AuthInputField({ label, error, children }) {
  return (
    <div className="form-group">
      <div className="input-label">{label}</div>
      {children}
      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
