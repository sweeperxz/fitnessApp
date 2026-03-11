import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getWorkouts, createWorkout, deleteWorkout } from '../api'
import { tapHaptic, mediumHaptic, successHaptic } from '../utils/haptic'

const MUSCLE_KEYS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio']
const DB = [
  { n: 'Жим лёжа', m: 'Chest' }, { n: 'Разводка гантелями', m: 'Chest' }, { n: 'Отжимания', m: 'Chest' }, { n: 'Кроссовер', m: 'Chest' },
  { n: 'Тяга верхнего блока', m: 'Back' }, { n: 'Тяга штанги в наклоне', m: 'Back' }, { n: 'Становая тяга', m: 'Back' }, { n: 'Подтягивания', m: 'Back' }, { n: 'Гиперэкстензия', m: 'Back' },
  { n: 'Приседания со штангой', m: 'Legs' }, { n: 'Жим ногами', m: 'Legs' }, { n: 'Выпады', m: 'Legs' }, { n: 'Сгибание ног', m: 'Legs' }, { n: 'Разгибание ног', m: 'Legs' }, { n: 'Подъём на носки', m: 'Legs' },
  { n: 'Жим гантелей сидя', m: 'Shoulders' }, { n: 'Армейский жим', m: 'Shoulders' }, { n: 'Махи в стороны', m: 'Shoulders' }, { n: 'Тяга к подбородку', m: 'Shoulders' },
  { n: 'Подъём штанги на бицепс', m: 'Biceps' }, { n: 'Молотковые сгибания', m: 'Biceps' },
  { n: 'Жим узким хватом', m: 'Triceps' }, { n: 'Разгибания на блоке', m: 'Triceps' }, { n: 'Французский жим', m: 'Triceps' },
  { n: 'Скручивания', m: 'Abs' }, { n: 'Планка', m: 'Abs' }, { n: 'Подъём ног', m: 'Abs' },
  { n: 'Бег', m: 'Cardio' }, { n: 'Скакалка', m: 'Cardio' }, { n: 'Велотренажёр', m: 'Cardio' }, { n: 'Эллипс', m: 'Cardio' },
]
const MCOLORS = { Chest: '#a78bfa', Back: '#38bdf8', Legs: '#fbbf24', Shoulders: '#fb923c', Biceps: 'var(--accent3)', Triceps: 'var(--accent)', Abs: '#f43f5e', Cardio: '#ec4899' }

function getWeek(base) {
  const s = base.startOf('week')
  return Array.from({ length: 7 }, (_, i) => s.add(i, 'day'))
}

function LibrarySheet({ onAdd, onClose }) {
  const { t } = useTranslation()
  const [muscle, setMuscle] = useState('All')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState([])
  const filtered = DB.filter(e => (muscle === 'All' || e.m === muscle) && e.n.toLowerCase().includes(search.toLowerCase()))
  const toggle = e => {
    tapHaptic()
    setSel(a => a.find(x => x.n === e.n) ? a.filter(x => x.n !== e.n) : [...a, e])
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>{t('workouts.lib.title')}</div>
          {sel.length > 0 && (
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
              onClick={() => { onAdd(sel); onClose() }}>{t('workouts.lib.add_btn', { count: sel.length })}</button>
          )}
        </div>
        <input className="input" placeholder={t('workouts.lib.search')} value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10, flexShrink: 0 }} />
        <div className="chip-scroll" style={{ marginBottom: 12, flexShrink: 0 }}>
          {MUSCLE_KEYS.map(m => <button key={m} onClick={() => setMuscle(m)} className={`chip${muscle === m ? ' active' : ''}`}>{t(`workouts.lib.muscles.${m}`)}</button>)}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {filtered.map(e => {
            const active = sel.some(x => x.n === e.n)
            return (
              <div key={e.n} onClick={() => toggle(e)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: MCOLORS[e.m] || 'var(--text3)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text)' }}>{e.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t(`workouts.lib.muscles.${e.m}`)}</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--accent)' : 'var(--bg3)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={active ? '#000' : 'var(--text2)'} strokeWidth={3} strokeLinecap="round">
                    {active ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

function NewWorkoutSheet({ onClose, onSave, day }) {
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
    } finally { setSaving(false) }
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

export default function WorkoutsPage() {
  const { t } = useTranslation()
  const [week, setWeek] = useState(dayjs())
  const [day, setDay] = useState(dayjs())
  const [workouts, setWorkouts] = useState([])
  const [modal, setModal] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const wd = getWeek(week)

  const load = useCallback(async () => {
    try { 
      setWorkouts(await getWorkouts({ from_date: wd[0].format('YYYY-MM-DD'), to_date: wd[6].format('YYYY-MM-DD') })) 
      setIsOffline(false)
    }
    catch(err) { 
      if (err.isOffline || !navigator.onLine) setIsOffline(true)
      setWorkouts([]) 
    }
  }, [week, wd])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); load() }
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [load])

  const dayWo = workouts.filter(w => w.day === day.format('YYYY-MM-DD'))
  const hasWo = d => workouts.some(w => w.day === d.format('YYYY-MM-DD'))
  const totSets = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets, 0), 0)
  const totTons = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets * e.reps * e.weight_kg / 1000, 0), 0)

  return (
    <>
      <div className="page-header"><div className="page-title">{t('workouts.title').slice(0, 5)}<span>{t('workouts.title').slice(5)}</span></div></div>

      {/* Mini stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { v: workouts.length, l: t('workouts.stats.count') },
          { v: totSets, l: t('workouts.stats.sets') },
          { v: totTons.toFixed(1) + (t('today.ml')[0].toLowerCase() === 'м' ? 'т' : 't'), l: t('workouts.stats.volume') }
        ].map(s => (
          <div key={s.l} className="card" style={{ flex: 1, margin: 0, textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)' }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Week picker */}
      <div className="card">
        <div className="week-nav">
          <button className="week-nav-btn" onClick={() => { tapHaptic(); setWeek(w => w.subtract(1, 'week')) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className="week-label">{wd[0].format('D')} – {wd[6].format('D MMM')}</span>
          <button className="week-nav-btn" onClick={() => { tapHaptic(); setWeek(w => w.add(1, 'week')) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
        <div className="week-strip">
          {wd.map(d => (
            <div key={d.format('D')} className={`week-day${d.isSame(day, 'day') ? ' active' : ''}`} onClick={() => { tapHaptic(); setDay(d) }}>
              <div className="week-day-name">{d.format('dd').toUpperCase()}</div>
              <div className="week-day-num">{d.format('D')}</div>
              {hasWo(d) && <div className="week-dot" />}
            </div>
          ))}
        </div>
      </div>

      {isOffline ? (
        <div className="empty">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
            </svg>
          </div>
          <div className="empty-title">{t('common.offline')}</div>
          <div className="empty-text">{t('common.offline_desc')}</div>
        </div>
      ) : dayWo.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
              <path d="M6 4v16M18 4v16M6 12h12M3 8h2M3 16h2M19 8h2M19 16h2" />
            </svg>
          </div>
          <div className="empty-title">{t('workouts.empty.title')}</div>
          <div className="empty-text">{t('workouts.empty.text', { date: day.format('D MMMM') })}</div>
        </div>
      ) : dayWo.map(w => (
        <div key={w.id} className="workout-card">
          <div className="workout-card-header">
            <div>
              <div className="workout-card-title">{w.title}</div>
              {w.notes && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{w.notes}</div>}
            </div>
            <button className="workout-card-del" onClick={() => { mediumHaptic(); deleteWorkout(w.id).then(() => { successHaptic(); load(); }) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {w.exercises.map(e => (
            <div key={e.id} className="exercise-row">
              <div>
                <div className="exercise-name">{e.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{e.sets} × {e.reps} {t('workouts.add.reps').toLowerCase()}</div>
              </div>
              <div className="exercise-badge">{e.weight_kg > 0 ? `${e.weight_kg} ${t('workouts.add.kg').toLowerCase()}` : t('workouts.add.no_weight')}</div>
            </div>
          ))}
        </div>
      ))}

      {createPortal(
        <>
          <button className="fab" onClick={() => { mediumHaptic(); setModal(true) }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          {modal && <NewWorkoutSheet onClose={() => setModal(false)} onSave={d => { successHaptic(); return createWorkout(d).then(w => { load(); return w }) }} day={day} />}
        </>,
        document.body
      )}
    </>
  )
}
