import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sendChatMessage, addRecentFood } from '../../api'

export default function AiTab({ onSelect }) {
    const { t } = useTranslation()
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    const calculate = async () => {
        const q = text.trim()
        if (!q) return
        setLoading(true); setError(''); setResult(null)
        try {
            const prompt = `Ты нутрициолог. Пользователь описал свой приём пищи. Верни ТОЛЬКО JSON-объект (без markdown, без пояснений) со следующими полями:
{
  "name": "краткое название блюда",
  "calories": число (ккал),
  "protein": число (г),
  "fat": число (г),
  "carbs": число (г)
}

Описание приёма пищи: ${q}`

            const res = await sendChatMessage({ messages: [{ role: 'user', content: prompt }] })
            const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            // Вырезаем JSON из ответа (на случай если модель обернула в ```)
            const jsonMatch = raw.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('Не удалось распознать ответ AI')
            const parsed = JSON.parse(jsonMatch[0])
            if (!parsed.calories) throw new Error('AI не вернул калории')
            setResult(parsed)
        } catch (e) {
            setError(e.message || 'Ошибка распознавания текста')
        }
        setLoading(false)
    }

    const statColors = { [t('today.calories').slice(0, 4)]: 'var(--blue2)', [t('today.protein')]: 'var(--purple)', [t('today.fat')]: 'var(--amber)', [t('today.carbs').slice(0, 5)]: 'var(--blue)' }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{t('meals.ai_description')}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Поле ввода */}
            <textarea
                className="input"
                placeholder={t('meals.ai_guess_placeholder')}
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                style={{
                    resize: 'none', lineHeight: 1.5, fontSize: 14,
                    marginBottom: 12, fontFamily: 'inherit',
                }}
            />

            <button
                className="btn-primary"
                onClick={calculate}
                disabled={loading || !text.trim()}
                style={{ marginBottom: 16 }}
            >
                {loading
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        {t('meals.ai_recognizing')}
                    </div>
                    : t('meals.ai_guess_button')}
            </button>

            {/* Ошибка */}
            {error && (
                <div style={{
                    padding: '12px 14px', borderRadius: 8, marginBottom: 14,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 13, color: '#fca5a5', lineHeight: 1.5,
                }}>
                    {error}
                </div>
            )}

            {/* Результат */}
            {result && (
                <div style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: 14,
                }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{result.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                        {[
                            { l: t('today.calories').slice(0, 4), v: result.calories },
                            { l: t('today.protein'), v: result.protein + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g') },
                            { l: t('today.fat'), v: result.fat + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g') },
                            { l: t('today.carbs').slice(0, 5), v: result.carbs + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g') },
                        ].map(s => (
                            <div key={s.l} style={{
                                flex: 1, textAlign: 'center',
                                background: 'var(--bg4)', borderRadius: 8, padding: '8px 4px',
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: statColors[s.l] }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            // Сохраняем распознанный AI продукт в недавние
                            addRecentFood(result).catch(() => { })
                            onSelect(result)
                        }}
                    >
                        {t('meals.ai_use_data')}
                    </button>
                </div>
            )}
        </>
    )
}
