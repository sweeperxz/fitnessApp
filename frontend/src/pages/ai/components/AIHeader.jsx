import React from 'react'

export default function AIHeader({ title, hasMessages, onClear, clearLabel }) {
  const [left, right] = title.split('-')

  return (
    <div className="page-header" style={{ flexShrink: 0, paddingBottom: 12 }}>
      <div className="page-title">{left}<span>-{right}</span></div>
      {hasMessages && (
        <button
          onClick={onClear}
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            color: 'var(--text2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          {clearLabel}
        </button>
      )}
    </div>
  )
}
