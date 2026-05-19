import React from 'react'

export default function AIHeader({ title, hasMessages, onClear, clearLabel }) {
  const parts = title.split(/[\s-]/)
  const left = parts[0]
  const right = parts.slice(1).join(' ')

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 6, flexShrink: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, color: 'var(--text)' }}>
        {left}<span style={{ color: 'var(--blue2)' }}>{right ? ` ${right}` : ''}</span>
      </div>
      
      {hasMessages && (
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '5px 12px',
            color: 'var(--text2)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'all 0.2s',
          }}
          className="hover-bg-target"
        >
          {clearLabel}
        </button>
      )}
    </div>
  )
}
