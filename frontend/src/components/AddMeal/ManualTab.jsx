import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MEAL_TYPES } from '../../utils/constants'
import { addRecentFood } from '../../api'

export default function ManualTab({ initial, onAdd, onClose }) {
    const { t } = useTranslation()
    const [form, setForm] = useState({
        meal_type: 'Breakfast',
        name: '', calories: '', protein: '', fat: '', carbs: '', weight: '100',
        ...(initial || {}),
    })

    const [isPer100Mode, setIsPer100Mode] = useState(initial ? (initial.calories > 0) : true)
    const [showMacrosOverride, setShowMacrosOverride] = useState(false)

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const w = +form.weight || 0

    const submit = () => {
        if (!form.name || !form.calories) return
        const ratio = isPer100Mode ? w / 100 : 1

        const mealItem = {
            name: form.name + (form.brand && !initial ? ` (${form.brand})` : ''),
            calories: Math.round(+form.calories * ratio),
            protein: Math.round((+form.protein || 0) * ratio),
            fat: Math.round((+form.fat || 0) * ratio),
            carbs: Math.round((+form.carbs || 0) * ratio),
        }

        const recentItem = {
            name: form.name,
            brand: form.brand || null,
            calories: +form.calories,
            protein: +form.protein || 0,
            fat: +form.fat || 0,
            carbs: +form.carbs || 0,
        }
        addRecentFood(recentItem).catch(() => { })

        onAdd({
            meal_type: form.meal_type,
            ...mealItem
        })
        onClose()
    }

    const isLoggingSelected = !!initial && initial.calories !== undefined && initial.calories !== null && initial.calories !== ''

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isLoggingSelected ? (
                // ───── Режим добавления выбранного продукта (Поиск / Сканер) ─────
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Карточка выбранного продукта */}
                    <div style={{
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                                    {form.name}
                                </div>
                                {form.brand && (
                                    <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, marginTop: 2 }}>
                                        {form.brand}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowMacrosOverride(!showMacrosOverride)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--blue2)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                {showMacrosOverride ? t('common.cancel') : t('meals.barcode_tab.edit_macros', 'Edit')}
                            </button>
                        </div>

                        {/* Базовые макросы (мелким шрифтом) */}
                        <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 8, marginTop: 4 }}>
                            <span>100г:</span>
                            <span>{form.calories} ккал</span>·
                            <span>Б:{form.protein}г</span>·
                            <span>Ж:{form.fat}г</span>·
                            <span>У:{form.carbs}г</span>
                        </div>
                    </div>

                    {/* Поля редактирования БЖУ при переопределении */}
                    {showMacrosOverride && (
                        <div style={{
                            background: 'var(--bg3)',
                            border: '1px solid var(--border)',
                            borderRadius: '14px',
                            padding: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            animation: 'slideUp 0.25s ease-out'
                        }}>
                            <div className="input-row" style={{ margin: 0 }}>
                                <div>
                                    <div className="input-label">{t('meals.manual_kcal_in_100')}</div>
                                    <input className="input" type="number" inputMode="decimal" value={form.calories}
                                        onChange={e => upd('calories', e.target.value)} />
                                </div>
                                <div>
                                    <div className="input-label">{t('meals.manual_protein_in_100')}</div>
                                    <input className="input" type="number" inputMode="decimal" value={form.protein}
                                        onChange={e => upd('protein', e.target.value)} />
                                </div>
                            </div>
                            <div className="input-row" style={{ margin: 0 }}>
                                <div>
                                    <div className="input-label">{t('meals.manual_fat_in_100')}</div>
                                    <input className="input" type="number" inputMode="decimal" value={form.fat}
                                        onChange={e => upd('fat', e.target.value)} />
                                </div>
                                <div>
                                    <div className="input-label">{t('meals.manual_carbs_in_100')}</div>
                                    <input className="input" type="number" inputMode="decimal" value={form.carbs}
                                        onChange={e => upd('carbs', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Выбор приема пищи и Вес */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1.2 }}>
                            <div className="input-label">{t('today.meals')}</div>
                            <select className="input" value={form.meal_type} onChange={e => upd('meal_type', e.target.value)} style={{ padding: '10px 12px' }}>
                                {MEAL_TYPES.map(tk => <option key={tk} value={tk}>{t(`meals.${tk}`)}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="input-label">{t('meals.manual_weight_label')} (г)</div>
                            <input className="input" type="number" inputMode="decimal" value={form.weight}
                                onChange={e => upd('weight', e.target.value)} style={{ padding: '10px 12px' }} />
                        </div>
                    </div>

                    {/* Пресеты веса для быстрой вставки */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: -4 }}>
                        {['50', '100', '150', '200', '250', '300'].map(preset => (
                            <button
                                key={preset}
                                onClick={() => upd('weight', preset)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: w === +preset ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg3)',
                                    borderColor: w === +preset ? 'var(--blue)' : 'var(--border)',
                                    color: w === +preset ? 'var(--blue2)' : 'var(--text2)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {preset} г
                            </button>
                        ))}
                    </div>

                    {/* Итоговые макросы порции */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.12)',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 4
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>{t('meals.manual_total')}</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--blue2)' }}>
                                {Math.round((+form.calories * w) / 100)} {t('today.calories').toLowerCase().includes('кал') ? 'ккал' : 'kcal'}
                            </span>
                        </div>

                        {/* Горизонтальные пилюли для макросов порции */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase' }}>{t('today.protein')}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                                    {Math.round(((+form.protein || 0) * w) / 100)}г
                                </span>
                            </div>
                            <div style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase' }}>{t('today.fat')}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                                    {Math.round(((+form.fat || 0) * w) / 100)}г
                                </span>
                            </div>
                            <div style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>{t('today.carbs')}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                                    {Math.round(((+form.carbs || 0) * w) / 100)}г
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // ───── Режим ручного ввода с нуля (Custom Food) ─────
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1.2 }}>
                            <div className="input-label">{t('today.meals')}</div>
                            <select className="input" value={form.meal_type} onChange={e => upd('meal_type', e.target.value)} style={{ padding: '10px 12px' }}>
                                {MEAL_TYPES.map(tk => <option key={tk} value={tk}>{t(`meals.${tk}`)}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="input-label">{t('meals.manual_weight_label')} (г)</div>
                            <input className="input" type="number" inputMode="decimal" value={form.weight}
                                onChange={e => upd('weight', e.target.value)} style={{ padding: '10px 12px' }} />
                        </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <div className="input-label">{t('meals.manual_name')} *</div>
                        <input className="input" placeholder={t('meals.search_placeholder')} value={form.name}
                            onChange={e => upd('name', e.target.value)} style={{ padding: '10px 12px' }} />
                    </div>

                    {/* Переключатель 100г vs порция */}
                    <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '12px', padding: 3, border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setIsPer100Mode(true)}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                border: 'none',
                                background: isPer100Mode ? 'var(--bg2)' : 'transparent',
                                color: isPer100Mode ? 'var(--text)' : 'var(--text2)',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.2s',
                                boxShadow: isPer100Mode ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                            }}
                        >
                            {t('meals.manual_per_100')}
                        </button>
                        <button
                            onClick={() => setIsPer100Mode(false)}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                border: 'none',
                                background: !isPer100Mode ? 'var(--bg2)' : 'transparent',
                                color: !isPer100Mode ? 'var(--text)' : 'var(--text2)',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.2s',
                                boxShadow: !isPer100Mode ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                            }}
                        >
                            {t('meals.manual_per_portion')}
                        </button>
                    </div>

                    {/* Поля БЖУ и Калорийность в виде компактной сетки 2x2 */}
                    <div style={{
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                    }}>
                        <div className="input-row" style={{ margin: 0, gap: 12 }}>
                            <div>
                                <div className="input-label" style={{ fontSize: 11 }}>
                                    {t(isPer100Mode ? 'meals.manual_kcal_in_100' : 'meals.manual_kcal_in_portion')} *
                                </div>
                                <input className="input" type="number" inputMode="decimal" placeholder="0"
                                    value={form.calories} onChange={e => upd('calories', e.target.value)} style={{ padding: '8px 12px' }} />
                            </div>
                            <div>
                                <div className="input-label" style={{ fontSize: 11 }}>
                                    {t(isPer100Mode ? 'meals.manual_protein_in_100' : 'meals.manual_protein_in_portion')}
                                </div>
                                <input className="input" type="number" inputMode="decimal" placeholder="0"
                                    value={form.protein} onChange={e => upd('protein', e.target.value)} style={{ padding: '8px 12px' }} />
                            </div>
                        </div>
                        <div className="input-row" style={{ margin: 0, gap: 12 }}>
                            <div>
                                <div className="input-label" style={{ fontSize: 11 }}>
                                    {t(isPer100Mode ? 'meals.manual_fat_in_100' : 'meals.manual_fat_in_portion')}
                                </div>
                                <input className="input" type="number" inputMode="decimal" placeholder="0"
                                    value={form.fat} onChange={e => upd('fat', e.target.value)} style={{ padding: '8px 12px' }} />
                            </div>
                            <div>
                                <div className="input-label" style={{ fontSize: 11 }}>
                                    {t(isPer100Mode ? 'meals.manual_carbs_in_100' : 'meals.manual_carbs_in_portion')}
                                </div>
                                <input className="input" type="number" inputMode="decimal" placeholder="0"
                                    value={form.carbs} onChange={e => upd('carbs', e.target.value)} style={{ padding: '8px 12px' }} />
                            </div>
                        </div>
                    </div>

                    {/* Информационный итог */}
                    {isPer100Mode && form.calories && (
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            fontSize: 12,
                            color: 'var(--text2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline'
                        }}>
                            <span>{t('meals.manual_total')}:</span>
                            <span style={{ color: 'var(--blue2)', fontWeight: 800 }}>
                                {Math.round((+form.calories * w) / 100)} ккал ({w}г)
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Кнопка отправки */}
            <button
                className="btn-primary"
                onClick={submit}
                disabled={!form.name || !form.calories}
                style={{
                    marginTop: 4,
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)'
                }}
            >
                {t('common.save')}
            </button>
        </div>
    )
}
