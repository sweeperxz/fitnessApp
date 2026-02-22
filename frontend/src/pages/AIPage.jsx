import React, { useState, useRef, useEffect } from 'react'
import { getProfile, sendChatMessage } from '../api'
import ReactMarkdown from 'react-markdown'

const SUGGEST = [
    'Что поесть вечером, если осталось 500 ккал?',
    'Как заменить становую тягу дома?',
    'Составь план питания на день',
    'Сколько воды пить при наборе массы?',
    'Объясни разницу между похудением и сушкой',
]

export default function AIPage() {
    const [msgs, setMsgs] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState(null)
    const endRef = useRef(null)

    useEffect(() => {
        getProfile().catch(() => null).then(p => setProfile(p))
    }, [])
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs, loading])

    const send = async (text) => {
        const msg = text || input.trim()
        if (!msg || loading) return

        setInput('')
        const next = [...msgs, { role: 'user', content: msg }]
        setMsgs(next)
        setLoading(true)

        try {
            const data = await sendChatMessage({ messages: next })
            const parts = data.candidates?.[0]?.content?.parts;
            const reply = parts ? parts.map(p => p.text).join('') : 'Ошибка получения ответа от ИИ.';

            setMsgs(m => [...m, { role: 'assistant', content: reply }])
        } catch (error) {
            console.error("AI Error:", error)
            setMsgs(m => [...m, { role: 'assistant', content: 'Ошибка соединения с сервером.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ flexShrink: 0, paddingBottom: 12 }}>
                <div className="page-title">AI-<span>ассистент</span></div>
                {msgs.length > 0 && (
                    <button onClick={() => setMsgs([])} style={{
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: 'var(--text2)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font)'
                    }}>
                        Очистить
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
                {msgs.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingBottom: 16 }}>
                        <div style={{ width: '100%', maxWidth: 380 }}>
                            <div style={{ padding: '0 0 24px', textAlign: 'center' }}>
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    background: 'linear-gradient(135deg,var(--blue2),var(--blue))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 14px'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff"
                                        strokeWidth={2} strokeLinecap="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path
                                            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Nutrio Ассистент</div>
                                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>В сети</div>
                                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>Задай вопрос о питании, тренировках или составлении плана
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {SUGGEST.map((s, i) => (
                                    <button key={i} onClick={() => send(s)} style={{
                                        background: 'var(--bg2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--r)',
                                        padding: '12px 14px',
                                        textAlign: 'left',
                                        color: 'var(--text)',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font)',
                                        lineHeight: 1.4,
                                        transition: 'border-color 0.15s, background 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--bg3)' }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)' }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ paddingBottom: 16 }}>
                        {msgs.map((m, i) => (
                            <div key={i} className={`bubble-wrap${m.role === 'user' ? ' user' : ''}`}>
                                {m.role === 'assistant' && (
                                    <div className="bubble-avatar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="var(--blue)" strokeWidth={2} strokeLinecap="round">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                                        </svg>
                                    </div>
                                )}
                                <div className={`bubble${m.role === 'assistant' ? ' ai markdown-content' : ' user'}`}>
                                    {m.role === 'assistant' ? (
                                        <ReactMarkdown>
                                            {m.content}
                                        </ReactMarkdown>
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="bubble-wrap">
                                <div className="bubble-avatar">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)"
                                        strokeWidth={2} strokeLinecap="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                                    </svg>
                                </div>
                                <div className="bubble ai"
                                    style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '14px 16px' }}>
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <input className="chat-input" placeholder="Задай вопрос..." value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} />
                <button className="chat-send" onClick={() => send()} disabled={!input.trim() || loading}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                        strokeLinecap="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                </button>
            </div>
        </div>
    )
}