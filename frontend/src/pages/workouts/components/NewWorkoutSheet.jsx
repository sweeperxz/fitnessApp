import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import LibrarySheet from './LibrarySheet'

export default function NewWorkoutSheet({ onClose, onSave, day }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(t('workouts.add.title'))
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [lib, setLib] = useState(false)
  const [saving, setSaving] = useState(false)

  const addFromLib = list => setExercises(prev => {
    const ex = new Set(prev.map(e => e.name))
    return [...prev, ...list.filter(e => !ex.has(e.n)).map(e => ({ name: e.n, sets: 3, reps: 10, weight_kg: 0 }))]
  })

  const upd = (i, k, v) => setExercises(e => e.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex))
  const remove = i => setExercises(e => e.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    try {
      const validExercises = exercises
        .filter(e => e.name.trim())
        .map(ex => ({ name: ex.name, sets: +ex.sets, reps: +ex.reps, weight_kg: +ex.weight_kg }))

      await onSave({
        title,
        day: day.format('YYYY-MM-DD'),
        notes,
        exercises: validExercises.length > 0 ? validExercises : undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-handle" />
          <div className="modal-title">{day.format('D MMMM')}</div>
          <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
            <div className="form-group"><div className="input-label">{t('workouts.add.name_label')}</div><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setLib(true)} className="btn-primary" style={{ flex: 2 }}>{t('workouts.add.from_lib')}</button>
              <button onClick={() => setExercises(e => [...e, { name: '', sets: 3, reps: 10, weight_kg: 0 }])} className="btn-outline" style={{ flex: 1 }}>{t('workouts.add.manual')}</button>
            </div>
            {exercises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 13 }}>{t('workouts.add.choose_ex')}</div>
            ) : exercises.map((ex, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: 12, marginBottom: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <input className="input" placeholder={t('workouts.lib.search')} value={ex.name} onChange={e => upd(i, 'name', e.target.value)} style={{ flex: 1, background: 'var(--bg4)' }} />
                  <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[{ l: t('workouts.add.sets'), k: 'sets' }, { l: t('workouts.add.reps'), k: 'reps' }, { l: t('workouts.add.kg'), k: 'weight_kg' }].map(f => (
                    <div key={f.k}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{f.l}</div>
                      <input className="input" type="number" value={ex[f.k]} onChange={e => upd(i, f.k, e.target.value)} style={{ padding: '10px 8px', textAlign: 'center', background: 'var(--bg4)' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="form-group" style={{ marginTop: 8 }}>
              <div className="input-label">{t('workouts.add.notes')}</div>
              <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} />
            </div>
          </div>
          <div style={{ paddingTop: 12, flexShrink: 0 }}>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? t('workouts.add.saving') : t('workouts.add.save')}</button>
          </div>
        </div>
      </div>
      {lib && <LibrarySheet onAdd={addFromLib} onClose={() => setLib(false)} />}
    </>,
    document.body
  )
}
