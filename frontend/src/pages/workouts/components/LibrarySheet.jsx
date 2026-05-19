import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { getExerciseLibrary } from '../../../api'
import { tapHaptic } from '../../../utils/haptic'
import { FALLBACK_EXERCISES, MCOLORS, MUSCLE_KEYS } from '../constants'

const CACHE_KEY = 'nutrio_exercise_library'

const normalizeFallback = item => ({
  id: `fallback:${item.n}`,
  name: item.n,
  muscle: item.m,
  equipment: '',
  description: '',
})

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function LibrarySheet({ onAdd, onClose }) {
  const { t } = useTranslation()
  const [muscle, setMuscle] = useState('All')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState([])
  const [items, setItems] = useState(() => readCache() || FALLBACK_EXERCISES.map(normalizeFallback))
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    getExerciseLibrary()
      .then(data => {
        if (cancelled) return
        setItems(data)
        setUsingFallback(false)
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      })
      .catch(() => {
        if (cancelled) return
        const cached = readCache()
        setItems(cached || FALLBACK_EXERCISES.map(normalizeFallback))
        setUsingFallback(!cached)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(e => (
      (muscle === 'All' || e.muscle === muscle) &&
      (!q || e.name.toLowerCase().includes(q))
    ))
  }, [items, muscle, search])

  const toggle = e => {
    tapHaptic()
    setSel(a => a.find(x => x.id === e.id) ? a.filter(x => x.id !== e.id) : [...a, e])
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ display: 'flex', maxHeight: '90vh', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>{t('workouts.lib.title')}</div>
          {sel.length > 0 && (
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
              onClick={() => {
                onAdd(sel)
                onClose()
              }}
            >
              {t('workouts.lib.add_btn', { count: sel.length })}
            </button>
          )}
        </div>
        <input className="input" style={{ marginBottom: 10, flexShrink: 0 }} placeholder={t('workouts.lib.search')} value={search} onChange={e => setSearch(e.target.value)} />
        <div className="chip-scroll" style={{ marginBottom: 12, flexShrink: 0 }}>
          {MUSCLE_KEYS.map(m => (
            <button key={m} onClick={() => setMuscle(m)} className={`chip${muscle === m ? ' active' : ''}`}>
              {t(`workouts.lib.muscles.${m}`)}
            </button>
          ))}
        </div>
        {usingFallback && (
          <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text3)' }}>
            {t('common.offline')}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading && filtered.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>{t('common.loading')}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>{t('workouts.add.choose_ex')}</div>
          ) : filtered.map(e => {
            const active = sel.some(x => x.id === e.id)
            return (
              <div key={e.id} onClick={() => toggle(e)} style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
                <div style={{ height: 8, width: 8, flexShrink: 0, borderRadius: '50%', background: MCOLORS[e.muscle] || 'var(--text3)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text)' }}>{e.name}</div>
                  <div style={{ marginTop: 1, fontSize: 11, color: 'var(--text3)' }}>
                    {t(`workouts.lib.muscles.${e.muscle}`)}{e.equipment ? ` · ${e.equipment}` : ''}
                  </div>
                </div>
                <div style={{
                  display: 'flex', height: 24, width: 24, flexShrink: 0,
                  alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent)' : 'var(--bg3)',
                }}>
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
