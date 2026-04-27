import React from 'react'

export default function AuthInputField({ label, error, children }) {
  return (
    <div className="form-group">
      <div className="input-label">{label}</div>
      {children}
      {error && (
        <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
