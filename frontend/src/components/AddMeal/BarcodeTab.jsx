import React, { useState } from 'react'
import BarcodeScanner from '../BarcodeScanner'
import { parseOFF } from '../../utils/openFoodFacts'
import { addRecentFood } from '../../api'

export default function BarcodeTab({ onSelect }) {
    const [scanning, setScanning] = useState(false)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [found, setFound] = useState(null)

    const lookup = async (rawCode) => {
        const bc = (rawCode || code).replace(/\D/g, '').trim()
        if (!bc) return
        setLoading(true); setError(''); setFound(null)
        try {
            const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${bc}.json`)
            const d = await r.json()
            if (d.status === 1 && d.product) {
                const item = parseOFF(d.product)
                if (item.calories > 0) {
                    setFound(item)
                } else {
                    setError('Продукт найден, но данные КБЖУ отсутствуют.')
                }
            } else {
                setError(`Штрихкод ${bc} не найден.\nПопробуй добавить вручную.`)
            }
        } catch {
            setError('Ошибка соединения. Проверь интернет.')
        }
        setLoading(false)
    }

    const handleSelect = (item) => {
        addRecentFood(item).catch(() => { })
        onSelect(item)
    }

    // Fullscreen сканер
    if (scanning) {
        return (
            <BarcodeScanner
                onResult={(code) => {
                    setScanning(false)
                    lookup(code)
                }}
                onClose={() => setScanning(false)}
            />
        )
    }

    return (
        <>
            <button
                onClick={() => { setScanning(true); setError(''); setFound(null) }}
                style={{
                    width: '100%', padding: '22px 16px', marginBottom: 16,
                    background: 'var(--bg3)', border: '1.5px dashed var(--border)',
                    borderRadius: 'var(--r)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                }}
            >
                <div style={{
                    width: 54, height: 54, borderRadius: 14,
                    background: 'var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Открыть камеру</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>iOS Safari 17.4+ · Android Chrome</div>
                </div>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>или введи код вручную</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="4607046820011"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookup()}
                    style={{ flex: 1 }}
                />
                <button
                    className="btn-primary"
                    onClick={() => lookup()}
                    style={{ width: 'auto', padding: '0 18px', flexShrink: 0 }}
                    disabled={loading || !code.trim()}
                >
                    {loading
                        ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : 'Найти'
                    }
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '12px 14px', borderRadius: 8, marginBottom: 14,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 13, color: '#fca5a5', lineHeight: 1.5, whiteSpace: 'pre-line',
                }}>
                    {error}
                </div>
            )}

            {found && (
                <div style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: 14,
                }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{found.name}</div>
                    {found.brand && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>{found.brand}</div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                        {[
                            { l: 'Ккал', v: found.calories, c: 'var(--blue2)' },
                            { l: 'Белки', v: found.protein + 'г', c: 'var(--purple)' },
                            { l: 'Жиры', v: found.fat + 'г', c: 'var(--amber)' },
                            { l: 'Углев', v: found.carbs + 'г', c: 'var(--blue)' },
                        ].map(s => (
                            <div key={s.l} style={{
                                flex: 1, textAlign: 'center',
                                background: 'var(--bg4)', borderRadius: 8, padding: '8px 4px',
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary" onClick={() => handleSelect(found)}>
                        Добавить этот продукт
                    </button>
                </div>
            )}
        </>
    )
}
