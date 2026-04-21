import React from 'react'
import ReactMarkdown from 'react-markdown'

function AssistantAvatar() {
  return (
    <div className="bubble-avatar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </div>
  )
}

export default function AIMessageList({ messages, loading, endRef }) {
  return (
    <div style={{ paddingBottom: 16 }}>
      {messages.map((message, i) => (
        <div key={i} className={`bubble-wrap${message.role === 'user' ? ' user' : ''}`}>
          {message.role === 'assistant' && <AssistantAvatar />}
          <div className={`bubble${message.role === 'assistant' ? ' ai markdown-content' : ' user'}`}>
            {message.role === 'assistant' ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="bubble-wrap">
          <AssistantAvatar />
          <div className="bubble ai" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '14px 16px' }}>
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
