import React, { useState } from 'react'
import { MEAL_TYPES } from '../../utils/constants'
import { addRecentFood } from '../../api'

export default function ManualTab({ initial, onAdd, onClose }) {
    const [form, setForm] = useState({
        meal_type: 'Завтрак',
        name: '', calories: '', protein: '', fat: '', carbs: '', weight: '100',
        ...(initial || {}),
    })

    // По умолчанию "На 100г", если есть initial (пришло из поиска), либо просто оставляем true по дефолту для удобства
    const [isPer100Mode, setIsPer100Mode] = useState(initial ? (initial.calories > 0) : true)

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const w = +form.weight || 100

    const submit = () => {
        if (!form.name || !form.calories) return
        const ratio = isPer100Mode ? w / 100 : 1

        // Структура блюда для записи в дневник
        const mealItem = {
            name: form.name,
            calories: Math.round(+form.calories * ratio),
            protein: Math.round(+form.protein * ratio),
            fat: Math.round(+form.fat * ratio),
            carbs: Math.round(+form.carbs * ratio),
        }

        // Сохраняем в недавние то, что ввели (базовые значения).
        const recentItem = {
            name: form.name,
            calories: +form.calories,
            protein: +form.protein || 0,
            fat: +form.fat || 0,
            carbs: +form.carbs || 0,
        }
        addRecentFood(recentItem).catch(() => { })

        // Добавляем в дневник
        onAdd({
            meal_type: form.meal_type,
            ...mealItem
        })

        onClose()
    }

    return (
        <>
            <div className="form-group">
                <div className="input-label">Приём пищи</div>
                <select className="input" value={form.meal_type} onChange={e => upd('meal_type', e.target.value)}>
                    {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
            </div>
            <div className="form-group">
                <div className="input-label">Название</div>
                <input className="input" placeholder="Например: Куриная грудка" value={form.name}
                    onChange={e => upd('name', e.target.value)} />
            </div>

            <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 14 }}>
                <button
                    onClick={() => setIsPer100Mode(true)}
                    style={{ flex: 1, padding: '8px 0', border: 'none', background: isPer100Mode ? 'var(--bg2)' : 'transparent', color: isPer100Mode ? 'var(--text)' : 'var(--text2)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s', boxShadow: isPer100Mode ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}>
                    На 100 грамм
                </button>
                <button
                    onClick={() => setIsPer100Mode(false)}
                    style={{ flex: 1, padding: '8px 0', border: 'none', background: !isPer100Mode ? 'var(--bg2)' : 'transparent', color: !isPer100Mode ? 'var(--text)' : 'var(--text2)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s', boxShadow: !isPer100Mode ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}>
                    Готовая порция
                </button>
            </div>

            {isPer100Mode && (
                <div className="form-group">
                    <div className="input-label">Вес съеденной порции (г)</div>
                    <input className="input" type="number" inputMode="decimal" value={form.weight}
                        onChange={e => upd('weight', e.target.value)} />

                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6, background: 'var(--bg4)', padding: '10px 12px', borderRadius: 'var(--r-sm)' }}>
                        Итого в порции: <span style={{ color: 'var(--blue2)', fontWeight: 800, fontSize: 13 }}>{Math.round(+form.calories * w / 100)} ккал</span>
                        <div style={{ marginTop: 4 }}>
                            Белки: <span style={{ color: 'var(--text)' }}>{Math.round(+form.protein * w / 100)}г</span> ·
                            Жиры: <span style={{ color: 'var(--text)' }}>{Math.round(+form.fat * w / 100)}г</span> ·
                            Углев: <span style={{ color: 'var(--text)' }}>{Math.round(+form.carbs * w / 100)}г</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="input-row">
                <div>
                    <div className="input-label">{isPer100Mode ? 'Ккал в 100г' : 'Ккал в порции'} *</div>
                    <input className="input" type="number" inputMode="decimal" placeholder="0"
                        value={form.calories} onChange={e => upd('calories', e.target.value)} />
                </div>
                <div>
                    <div className="input-label">{isPer100Mode ? 'Белки в 100г' : 'Белки в порции'} (г)</div>
                    <input className="input" type="number" inputMode="decimal" placeholder="0"
                        value={form.protein} onChange={e => upd('protein', e.target.value)} />
                </div>
            </div>
            <div className="input-row">
                <div>
                    <div className="input-label">{isPer100Mode ? 'Жиры в 100г' : 'Жиры в порции'} (г)</div>
                    <input className="input" type="number" inputMode="decimal" placeholder="0"
                        value={form.fat} onChange={e => upd('fat', e.target.value)} />
                </div>
                <div>
                    <div className="input-label">{isPer100Mode ? 'Углев. в 100г' : 'Углеводы в порции'} (г)</div>
                    <input className="input" type="number" inputMode="decimal" placeholder="0"
                        value={form.carbs} onChange={e => upd('carbs', e.target.value)} />
                </div>
            </div>

            <button className="btn-primary" onClick={submit} disabled={!form.name || !form.calories} style={{ marginTop: 8 }}>
                Добавить
            </button>
        </>
    )
}
