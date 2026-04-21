import React from 'react'

export default function AIInputBar({ input, loading, placeholder, onChange, onSend }) {
  return (
    <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
      <input
        className="chat-input"
        placeholder={placeholder}
        value={input}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
      />
      <button className="chat-send" onClick={() => onSend()} disabled={!input.trim() || loading}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </div>
  )
}
