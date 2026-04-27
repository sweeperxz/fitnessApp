import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { sendChatMessage } from '../api'
import { tapHaptic, successHaptic } from '../utils/haptic'
import AIHeader from './ai/components/AIHeader'
import AIWelcomeState from './ai/components/AIWelcomeState'
import AIMessageList from './ai/components/AIMessageList'
import AIInputBar from './ai/components/AIInputBar'

export default function AIPage() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  const suggestions = t('ai_chat.suggest', { returnObjects: true }) || []

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const message = text || input.trim()
    if (!message || loading) return

    tapHaptic()
    setInput('')
    const next = [...messages, { role: 'user', content: message }]
    setMessages(next)
    setLoading(true)

    try {
      const data = await sendChatMessage({ messages: next })
      const parts = data.candidates?.[0]?.content?.parts
      const reply = parts ? parts.map(p => p.text).join('') : t('ai_chat.error_reply')

      successHaptic()
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch (error) {
      console.error('AI Error:', error)
      setMessages(m => [...m, { role: 'assistant', content: t('ai_chat.error_conn') }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AIHeader
        title={t('ai_chat.title')}
        hasMessages={messages.length > 0}
        onClear={() => setMessages([])}
        clearLabel={t('ai_chat.clear')}
      />

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        {messages.length === 0 ? (
          <AIWelcomeState
            suggestions={suggestions}
            onSend={send}
            t={t}
          />
        ) : (
          <AIMessageList
            messages={messages}
            loading={loading}
            endRef={endRef}
          />
        )}
      </div>

      <AIInputBar
        input={input}
        loading={loading}
        placeholder={t('ai_chat.placeholder')}
        onChange={setInput}
        onSend={send}
      />
    </div>
  )
}
