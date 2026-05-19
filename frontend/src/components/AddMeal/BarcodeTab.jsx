import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BarcodeScanner from '../BarcodeScanner'
import { addRecentFood, findFoodByBarcode } from '../../api'

export default function BarcodeTab({ onSelect }) {
    const { t } = useTranslation()
    const [scanning, setScanning] = useState(false)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [found, setFound] = useState(null)

    // Стейты для создания продукта вручную при ненахождении штрих-кода
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [scannedBarcode, setScannedBarcode] = useState('')
    const [form, setForm] = useState({
        name: '',
        brand: '',
        calories: '',
        protein: '',
        fat: '',
        carbs: ''
    })

    const lookup = async (rawCode) => {
        const bc = (rawCode || code).replace(/\D/g, '').trim()
        if (!bc) return
        setLoading(true); setError(''); setFound(null); setScannedBarcode('')
        try {
            const item = await findFoodByBarcode(bc)
            setFound(item)
        } catch (err) {
            if (err.response?.status === 404) {
                setScannedBarcode(bc)
                setError(t('meals.barcode_tab.not_found', { barcode: bc }))
            } else {
                setError(t('meals.barcode_tab.connection_error'))
            }
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

    // Форма создания продукта
    if (showCreateForm) {
        return (
            <div style={{
                background: 'linear-gradient(145deg, var(--bg3) 0%, var(--bg2) 100%)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: 20,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                    {t('meals.barcode_tab.create_product')}
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                    <div className="input-label">{t('meals.barcode_tab.barcode_label')}</div>
                    <input className="input" type="text" disabled value={scannedBarcode} style={{ opacity: 0.6 }} />
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                    <div className="input-label">{t('meals.manual_name')} *</div>
                    <input className="input" placeholder={t('meals.barcode_tab.name_placeholder')} value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                    <div className="input-label">{t('meals.barcode_tab.brand_placeholder')}</div>
                    <input className="input" placeholder={t('meals.barcode_tab.brand_placeholder')} value={form.brand}
                        onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                </div>

                <div className="input-row" style={{ marginBottom: 12 }}>
                    <div>
                        <div className="input-label">{t('meals.barcode_tab.calories')} *</div>
                        <input className="input" type="number" inputMode="decimal" placeholder="0"
                            value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
                    </div>
                    <div>
                        <div className="input-label">{t('meals.barcode_tab.protein_g')}</div>
                        <input className="input" type="number" inputMode="decimal" placeholder="0"
                            value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
                    </div>
                </div>

                <div className="input-row" style={{ marginBottom: 20 }}>
                    <div>
                        <div className="input-label">{t('meals.barcode_tab.fat_g')}</div>
                        <input className="input" type="number" inputMode="decimal" placeholder="0"
                            value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
                    </div>
                    <div>
                        <div className="input-label">{t('meals.barcode_tab.carbs_g')}</div>
                        <input className="input" type="number" inputMode="decimal" placeholder="0"
                            value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            if (!form.name || !form.calories) return
                            const newItem = {
                                name: form.name,
                                brand: form.brand,
                                calories: Math.round(+form.calories),
                                protein: Math.round(+form.protein || 0),
                                fat: Math.round(+form.fat || 0),
                                carbs: Math.round(+form.carbs || 0),
                                barcode: scannedBarcode
                            }
                            try {
                                const saved = await addRecentFood(newItem)
                                onSelect(saved)
                            } catch (e) {
                                setError(t('meals.barcode_tab.connection_error'))
                            }
                        }}
                        disabled={!form.name || !form.calories}
                        style={{ flex: 1 }}
                    >
                        {t('meals.barcode_tab.save_and_add')}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setShowCreateForm(false)
                            setError('')
                        }}
                        style={{ flex: 1, background: 'var(--bg4)', color: 'var(--text)' }}
                    >
                        {t('meals.barcode_tab.cancel')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => { setScanning(true); setError(''); setFound(null); setScannedBarcode('') }}
                style={{
                    width: '100%', padding: '24px 20px', marginBottom: 20,
                    background: 'linear-gradient(135deg, var(--bg3) 0%, var(--bg2) 100%)',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 'var(--r)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--blue)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.16), 0 0 12px var(--blue-glow)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
            >
                <div style={{
                    width: 58, height: 58, borderRadius: 16,
                    background: 'linear-gradient(135deg, var(--blue2) 0%, var(--blue) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px var(--blue-glow)',
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>
                        {t('meals.barcode_tab.open_camera')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4, fontWeight: 500 }}>
                        {t('meals.barcode_tab.camera_hint')}
                    </div>
                </div>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap', fontWeight: 600, letterSpacing: '0.3px' }}>
                    {t('meals.barcode_tab.or_enter_manually')}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                    className="input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="4607046820011"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookup()}
                    style={{ 
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: 15,
                        borderRadius: 'var(--r-sm)',
                    }}
                />
                <button
                    className="btn-primary"
                    onClick={() => lookup()}
                    style={{ 
                        width: 'auto', 
                        padding: '0 24px', 
                        flexShrink: 0,
                        borderRadius: 'var(--r-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 48,
                    }}
                    disabled={loading || !code.trim()}
                >
                    {loading ? (
                        <div style={{ 
                            width: 18, 
                            height: 18, 
                            border: '2px solid rgba(255,255,255,0.3)', 
                            borderTopColor: '#fff', 
                            borderRadius: '50%', 
                            animation: 'spin 0.8s linear infinite' 
                        }} />
                    ) : (
                        t('meals.barcode_tab.find')
                    )}
                </button>
            </div>

            {error && (
                <div>
                    <div style={{
                        padding: '12px 16px', 
                        borderRadius: 'var(--r-sm)', 
                        marginBottom: 12,
                        background: 'rgba(239,68,68,0.06)', 
                        border: '1.5px solid rgba(239,68,68,0.15)',
                        fontSize: 13, 
                        color: '#f87171', 
                        lineHeight: 1.5, 
                        whiteSpace: 'pre-line',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        animation: 'shake 0.4s ease-in-out'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div style={{ flex: 1 }}>{error}</div>
                    </div>
                    {scannedBarcode && (
                        <button
                            onClick={() => {
                                setForm({
                                    name: '',
                                    brand: '',
                                    calories: '',
                                    protein: '',
                                    fat: '',
                                    carbs: ''
                                })
                                setShowCreateForm(true)
                            }}
                            style={{
                                width: '100%',
                                marginBottom: 16,
                                background: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                color: 'var(--blue2)',
                                borderRadius: 'var(--r-sm)',
                                padding: '12px 16px',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                transition: 'all 0.2s',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {t('meals.barcode_tab.create_product')}
                        </button>
                    )}
                </div>
            )}

            {found && (
                <div style={{
                    background: 'linear-gradient(145deg, var(--bg3) 0%, var(--bg2) 100%)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--r)',
                    padding: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                }}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                        {found.name}
                    </div>
                    {found.brand && (
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, fontWeight: 500 }}>
                            {found.brand}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {[
                            { l: t('meals.barcode_tab.kcal'), v: found.calories, c: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
                            { l: t('meals.barcode_tab.protein_g'), v: found.protein + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'), c: 'var(--purple)', bg: 'rgba(192,132,252,0.1)' },
                            { l: t('meals.barcode_tab.fat_g'), v: found.fat + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'), c: 'var(--amber)', bg: 'rgba(251,191,36,0.1)' },
                            { l: t('meals.barcode_tab.carbs_g'), v: found.carbs + (t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'), c: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                        ].map(s => (
                            <div key={s.l} style={{
                                flex: 1, textAlign: 'center',
                                background: s.bg,
                                borderRadius: 10,
                                padding: '10px 4px',
                                border: `1px solid ${s.bg}`,
                            }}>
                                <div style={{ fontSize: 15, fontWeight: 900, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    {s.l}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={() => handleSelect(found)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontWeight: 700,
                            borderRadius: 'var(--r-sm)',
                        }}
                    >
                        {t('meals.barcode_tab.add_this_product')}
                    </button>
                    <style>{`
                        @keyframes slideUp {
                            from { opacity: 0; transform: translateY(12px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </>
    )
}
