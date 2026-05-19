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
    const existing = new Set(prev.map(e => e.library_exercise_id || e.name))
    return [
      ...prev,
      ...list
        .filter(e => !existing.has(e.id) && !existing.has(e.name))
        .map(e => ({
          library_exercise_id: typeof e.id === 'number' ? e.id : undefined,
          name: e.name,
          sets: [
            { weight_kg: 0, reps: 10 },
            { weight_kg: 0, reps: 10 },
            { weight_kg: 0, reps: 10 }
          ],
        })),
    ]
  })

  const upd = (i, k, v) => setExercises(e => e.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex))
  const remove = i => setExercises(e => e.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    try {
      const validExercises = exercises
        .filter(e => e.name.trim())
        .map(ex => ({
          name: ex.name,
          library_exercise_id: ex.library_exercise_id,
          sets: ex.sets.map(s => ({
            weight_kg: +s.weight_kg || 0,
            reps: +s.reps || 0,
          }))
        }))

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
        <div className="modal" style={{ display: 'flex', maxHeight: '94vh', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <div className="modal-handle" />
          <div className="modal-title">{day.format('D MMMM')}</div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div className="form-group"><div className="input-label">{t('workouts.add.name_label')}</div><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setLib(true)} className="btn-primary" style={{ flex: 2 }}>{t('workouts.add.from_lib')}</button>
              <button onClick={() => setExercises(e => [...e, { name: '', sets: [{ weight_kg: 0, reps: 10 }] }])} className="btn-outline" style={{ flex: 1 }}>{t('workouts.add.manual')}</button>
            </div>
            {exercises.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>{t('workouts.add.choose_ex')}</div>
            ) : exercises.map((ex, i) => (
              <div key={i} style={{ marginBottom: 12, borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', padding: 12 }}>
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="input" style={{ flex: 1, background: 'var(--bg4)' }} placeholder={t('workouts.lib.search')} value={ex.name} onChange={e => upd(i, 'name', e.target.value)} />
                  <button onClick={() => remove(i)} style={{ flexShrink: 0, cursor: 'pointer', border: 0, background: 'transparent', padding: 4, color: 'var(--text3)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ex.sets.map((set, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', width: 20 }}>#{sIdx + 1}</span>
                      
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', background: 'var(--bg4)', borderRadius: 8, padding: '0 8px', border: '1px solid var(--border)' }}>
                        <input
                          type="number"
                          placeholder="0"
                          style={{ width: '100%', border: 0, background: 'transparent', color: 'var(--text)', padding: '8px 0', fontSize: 13, textAlign: 'center', outline: 'none' }}
                          value={set.weight_kg}
                          onChange={e => {
                            const val = e.target.value;
                            const newSets = ex.sets.map((s, idx) => idx === sIdx ? { ...s, weight_kg: val } : s);
                            upd(i, 'sets', newSets);
                          }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>{t('workouts.add.kg')}</span>
                      </div>

                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', background: 'var(--bg4)', borderRadius: 8, padding: '0 8px', border: '1px solid var(--border)' }}>
                        <input
                          type="number"
                          placeholder="0"
                          style={{ width: '100%', border: 0, background: 'transparent', color: 'var(--text)', padding: '8px 0', fontSize: 13, textAlign: 'center', outline: 'none' }}
                          value={set.reps}
                          onChange={e => {
                            const val = e.target.value;
                            const newSets = ex.sets.map((s, idx) => idx === sIdx ? { ...s, reps: val } : s);
                            upd(i, 'sets', newSets);
                          }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>{t('workouts.add.reps')}</span>
                      </div>

                      <button
                        disabled={ex.sets.length <= 1}
                        style={{
                          background: 'none',
                          border: 0,
                          color: ex.sets.length <= 1 ? 'transparent' : 'var(--text3)',
                          cursor: ex.sets.length <= 1 ? 'default' : 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onClick={() => {
                          if (ex.sets.length > 1) {
                            const newSets = ex.sets.filter((_, idx) => idx !== sIdx);
                            upd(i, 'sets', newSets);
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  style={{
                    marginTop: 10,
                    background: 'none',
                    border: '1px dashed var(--border)',
                    borderRadius: 8,
                    color: 'var(--blue2)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '6px 12px',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                  onClick={() => {
                    const lastSet = ex.sets[ex.sets.length - 1] || { weight_kg: 0, reps: 10 };
                    const newSets = [...ex.sets, { weight_kg: lastSet.weight_kg, reps: lastSet.reps }];
                    upd(i, 'sets', newSets);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {t('workouts.add.add_set') || '+ Добавить подход'}
                </button>
              </div>
            ))}
            <div className="form-group" style={{ marginTop: 8 }}>
              <div className="input-label">{t('workouts.add.notes')}</div>
              <textarea className="input" style={{ resize: 'none' }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <div style={{ flexShrink: 0, paddingTop: 12 }}>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? t('workouts.add.saving') : t('workouts.add.save')}</button>
          </div>
        </div>
      </div>
      {lib && <LibrarySheet onAdd={addFromLib} onClose={() => setLib(false)} />}
    </>,
    document.body
  )
}
