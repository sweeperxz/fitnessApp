import React, { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {
  getNutritionDay, addMeal, deleteMeal,
  logWater, getProfile,
  getRecentFoods, addRecentFood,
} from '../api'
import BarcodeScanner from '../components/BarcodeScanner'

dayjs.locale('ru')

const MEAL_TYPES = ['Завтрак', 'Обед', 'Ужин', 'Перекус']

const MealIcons = {
  Завтрак: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  Обед:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  Ужин:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Перекус: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
}

// ─── Calorie Ring ────────────────────────────────────────
function Ring({ eaten, goal }) {
  const [anim, setAnim] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnim(eaten), 60)
    return () => clearTimeout(t)
  }, [eaten])

  const r = 52, circ = 2 * Math.PI * r
  const ratio = goal > 0 ? anim / goal : 0
  const dash  = Math.min(ratio, 1) * circ
  const color = ratio >= 1 ? '#ef4444' : ratio > 0.85 ? '#f59e0b' : '#3b82f6'

  return (
    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg4)" strokeWidth="8"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1), stroke 0.3s' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{Math.round(eaten)}</div>
        <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3 }}>из {goal}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>ккал</div>
      </div>
    </div>
  )
}

// ── Open Food Facts ──────────────────────────────────────
function parseOFF(p) {
    const n = p.nutriments || {}

    // Умный поиск калорий: если нет ккал, берем джоули и переводим в ккал (делим на 4.184)
    let kcal = n['energy-kcal_100g'] || n['energy-kcal_value'] || 0;
    if (!kcal && n['energy_100g']) kcal = n['energy_100g'] / 4.184;

    return {
        name: p.product_name_ua || p.product_name_ru || p.product_name || p.brands || 'Без названия',
        brand: p.brands || '',
        calories: Math.round(kcal),
        // Также страхуемся по БЖУ, проверяя запасные поля _value
        protein: Math.round(n.proteins_100g || n.proteins_value || 0),
        fat: Math.round(n.fat_100g || n.fat_value || 0),
        carbs: Math.round(n.carbohydrates_100g || n.carbohydrates_value || 0),
    }
}

// ─── Search Tab ───────────────────────────────────────────
function SearchTab({ onSelect }) {
  const [q, setQ]                   = useState('')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [recent, setRecent]         = useState([])
  const [recentLoaded, setRecentLoaded] = useState(false)

  useEffect(() => {
    getRecentFoods()
      .then(d  => { setRecent(d);  setRecentLoaded(true) })
      .catch(() => { setRecent([]); setRecentLoaded(true) })
  }, [])

  const handleSelect = (item) => {
    addRecentFood(item).catch(() => {})
    onSelect(item)
  }

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) { setResults([]); setDone(false); return }

    const timer = setTimeout(async () => {
      setLoading(true); setDone(true)
      try {
        // Сначала ищем по Украине
        const r = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?` +
          `search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=30` +
          `&fields=product_name,product_name_ru,product_name_ua,brands,nutriments` +
          `&tagtype_0=countries&tag_contains_0=contains&tag_0=ukraine`
        )
        const d = await r.json()
        let parsed = (d.products || []).map(parseOFF).filter(p => p.calories > 0).slice(0, 8)

        // Если пусто — глобальный поиск
        if (parsed.length === 0) {
          const r2 = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?` +
            `search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=20` +
            `&fields=product_name,product_name_ru,product_name_ua,brands,nutriments`
          )
          const d2 = await r2.json()
          parsed = (d2.products || []).map(parseOFF).filter(p => p.calories > 0).slice(0, 8)
        }
        setResults(parsed)
      } catch { setResults([]) }
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [q])

  const isSearching = q.trim().length >= 2
  const list = isSearching ? results : recent

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          className="input"
          placeholder="Гречка, куриная грудка..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1 }}
          autoFocus
        />
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {loading
            ? <div style={{ width: 16, height: 16, border: '2px solid var(--text3)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          }
        </div>
      </div>

      {!isSearching && recentLoaded && recent.length > 0 && (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Недавние
        </div>
      )}

      {isSearching && loading && !results.length && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13 }}>Ищем...</div>
      )}
      {isSearching && !loading && done && !results.length && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>
          Ничего не найдено.<br/>Попробуй на русском или английском.
        </div>
      )}
      {!isSearching && recentLoaded && recent.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13, lineHeight: 1.7 }}>
          Здесь появятся<br/>твои недавние продукты
        </div>
      )}

      {list.map((item, i) => (
        <div key={i} onClick={() => handleSelect(item)} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
        }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
            {item.brand && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.brand}</div>}
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>
              Б:{item.protein}г · Ж:{item.fat}г · У:{item.carbs}г
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--blue2)' }}>{item.calories}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>ккал/100г</div>
          </div>
        </div>
      ))}
    </>
  )
}

// ─── Barcode Tab ───────────────────────────────────────────
function BarcodeTab({ onSelect }) {
  const [scanning, setScanning] = useState(false)
  const [code,     setCode]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [found,    setFound]    = useState(null)

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

  // Fullscreen сканер — твой BarcodeScanner компонент (нативный BarcodeDetector API)
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
      {/* Кнопка камеры */}
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
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Открыть камеру</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>iOS Safari 17.4+ · Android Chrome</div>
        </div>
      </button>

      {/* Разделитель */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>или введи код вручную</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
      </div>

      {/* Ручной ввод */}
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
            ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
            : 'Найти'
          }
        </button>
      </div>

      {/* Ошибка */}
      {error && (
        <div style={{
          padding: '12px 14px', borderRadius: 8, marginBottom: 14,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 13, color: '#fca5a5', lineHeight: 1.5, whiteSpace: 'pre-line',
        }}>
          {error}
        </div>
      )}

      {/* Найденный продукт */}
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
              { l: 'Ккал',  v: found.calories,      c: 'var(--blue2)' },
              { l: 'Белки', v: found.protein + 'г', c: '#a78bfa'      },
              { l: 'Жиры',  v: found.fat + 'г',     c: '#f59e0b'      },
              { l: 'Углев', v: found.carbs + 'г',   c: 'var(--blue)'  },
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
          <button className="btn-primary" onClick={() => onSelect(found)}>
            Добавить этот продукт
          </button>
        </div>
      )}
    </>
  )
}

// ─── Manual Tab ───────────────────────────────────────────
function ManualTab({ initial, onAdd, onClose }) {
  const [form, setForm] = useState({
    meal_type: 'Завтрак',
    name: '', calories: '', protein: '', fat: '', carbs: '', weight: '100',
    ...(initial || {}),
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isPer100 = initial?.calories > 0
  const w = +form.weight || 100

  const submit = () => {
    if (!form.name || !form.calories) return
    const ratio = isPer100 ? w / 100 : 1
    onAdd({
      meal_type: form.meal_type,
      name:      form.name,
      calories:  Math.round(+form.calories * ratio),
      protein:   Math.round(+form.protein  * ratio),
      fat:       Math.round(+form.fat      * ratio),
      carbs:     Math.round(+form.carbs    * ratio),
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
        <input className="input" placeholder="Куриная грудка" value={form.name}
          onChange={e => upd('name', e.target.value)}/>
      </div>
      {isPer100 && (
        <div className="form-group">
          <div className="input-label">Вес порции (г)</div>
          <input className="input" type="number" inputMode="decimal" value={form.weight}
            onChange={e => upd('weight', e.target.value)}/>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6, lineHeight: 1.6 }}>
            Итого: <strong>{Math.round(+form.calories * w / 100)}</strong> ккал ·
            Б:{Math.round(+form.protein * w / 100)}г ·
            Ж:{Math.round(+form.fat     * w / 100)}г ·
            У:{Math.round(+form.carbs   * w / 100)}г
          </div>
        </div>
      )}
      <div className="input-row">
        <div>
          <div className="input-label">{isPer100 ? 'Ккал/100г' : 'Калории'}</div>
          <input className="input" type="number" inputMode="decimal" placeholder="0"
            value={form.calories} onChange={e => upd('calories', e.target.value)}/>
        </div>
        <div>
          <div className="input-label">{isPer100 ? 'Белки/100г' : 'Белки г'}</div>
          <input className="input" type="number" inputMode="decimal" placeholder="0"
            value={form.protein} onChange={e => upd('protein', e.target.value)}/>
        </div>
      </div>
      <div className="input-row">
        <div>
          <div className="input-label">{isPer100 ? 'Жиры/100г' : 'Жиры г'}</div>
          <input className="input" type="number" inputMode="decimal" placeholder="0"
            value={form.fat} onChange={e => upd('fat', e.target.value)}/>
        </div>
        <div>
          <div className="input-label">{isPer100 ? 'Углев./100г' : 'Углеводы г'}</div>
          <input className="input" type="number" inputMode="decimal" placeholder="0"
            value={form.carbs} onChange={e => upd('carbs', e.target.value)}/>
        </div>
      </div>
      <button className="btn-primary" onClick={submit} disabled={!form.name || !form.calories}>
        Добавить
      </button>
    </>
  )
}

// ─── Add Modal ────────────────────────────────────────────
const TABS = ['Поиск', 'Штрихкод', 'Вручную']

function AddModal({ onClose, onAdd }) {
  const [tab, setTab]           = useState(0)
  const [selected, setSelected] = useState(null)

  // После выбора продукта из поиска или сканера — переходим в "Вручную" с заполненными полями
  const pick = (item) => {
    setSelected(item)
    setTab(2)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-handle"/>
        <div className="modal-title">Добавить блюдо</div>

        <div className="food-tabs" style={{ flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              className={`food-tab${tab === i ? ' active' : ''}`}
              onClick={() => { setTab(i); setSelected(null) }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Скроллируемое содержимое вкладки */}
        <div style={{
          overflowY: 'auto', flex: 1,
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        }}>
          {tab === 0 && <SearchTab onSelect={pick}/>}
          {tab === 1 && <BarcodeTab onSelect={pick}/>}
          {tab === 2 && (
            <ManualTab
              initial={selected ? {
                name:     selected.name + (selected.brand ? ` (${selected.brand})` : ''),
                calories: selected.calories,
                protein:  selected.protein,
                fat:      selected.fat,
                carbs:    selected.carbs,
              } : null}
              onAdd={onAdd}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function TodayPage() {
  const [day, setDay]           = useState(dayjs())
  const [data, setData]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [modal, setModal]       = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)

  const fb = { calories_goal: 2000, protein_goal: 150, fat_goal: 70, carbs_goal: 250, water_goal: 2500 }

  const load = useCallback(async () => {
    try {
      const [nd, pr] = await Promise.all([
        getNutritionDay(day.format('YYYY-MM-DD')),
        getProfile().catch(() => fb),
      ])
      setData(nd)
      setProfile(pr)
    } catch {
      setData({ meals: [], total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, water_ml: 0 })
      setProfile(fb)
    }
  }, [day])

  useEffect(() => { load() }, [load])

  const pr = profile || fb
  const d  = data    || { meals: [], total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, water_ml: 0 }

  const remaining = Math.max(pr.calories_goal - d.total_calories, 0)
  const waterPct  = Math.min((d.water_ml / pr.water_goal) * 100, 100)
  const isToday   = day.isSame(dayjs(), 'day')
  const dayLabel  = isToday
    ? 'Сегодня'
    : day.isSame(dayjs().subtract(1, 'day'), 'day')
      ? 'Вчера'
      : day.format('D MMMM')

  const groups = MEAL_TYPES
    .map(t => ({ type: t, items: d.meals.filter(m => m.meal_type === t) }))
    .filter(g => g.items.length > 0)

  const macros = [
    { l: 'Белки',  v: d.total_protein, g: pr.protein_goal, c: '#a78bfa' },
    { l: 'Жиры',   v: d.total_fat,     g: pr.fat_goal,     c: '#f59e0b' },
    { l: 'Углев.', v: d.total_carbs,   g: pr.carbs_goal,   c: '#3b82f6' },
  ]

  const TIPS = [
    `Осталось ${remaining} ккал — ${remaining > 400 ? 'есть место для ужина' : 'лёгкий перекус'}.`,
    `Вода: ${d.water_ml} из ${pr.water_goal} мл. ${d.water_ml < pr.water_goal * 0.5 ? 'Не забывай пить воду.' : 'Хороший прогресс.'}`,
    `Белки: ${Math.round(d.total_protein)}/${pr.protein_goal}г — ${d.total_protein < pr.protein_goal * 0.7 ? 'добавь белок' : 'норма выполнена'}.`,
  ]

  return (
    <>
      {/* Заголовок + навигация по дням */}
      <div className="page-header">
        <div className="page-title">Fit<span>Flow</span></div>
        <div className="date-nav">
          <button className="date-nav-btn" onClick={() => setDay(d => d.subtract(1, 'day'))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="date-nav-label">{dayLabel}</span>
          <button className="date-nav-btn" onClick={() => setDay(d => d.add(1, 'day'))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Калории + макросы */}
      <div className="card">
        {!data
          ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--bg4)', borderTopColor: 'var(--blue)', borderRadius: '50%' }}/>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Ring eaten={d.total_calories} goal={pr.calories_goal}/>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {macros.map(m => (
                    <div key={m.l} className="macro-row">
                      <div className="macro-head">
                        <span className="macro-name">{m.l}</span>
                        <span className="macro-val">{Math.round(m.v)}<span>/{m.g}г</span></span>
                      </div>
                      <div className="macro-track">
                        <div className="macro-fill" style={{ width: Math.min((m.v / m.g) * 100, 100) + '%', background: m.c }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                {[
                  { l: 'Съедено',  v: Math.round(d.total_calories), c: 'var(--blue2)'  },
                  { l: 'Цель',     v: pr.calories_goal,             c: 'var(--text)'   },
                  { l: 'Осталось', v: remaining,                    c: remaining === 0 ? 'var(--red)' : 'var(--green)' },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                      {s.l}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.c, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </div>

      {/* Вода */}
      <div className="card">
        <div className="card-label">Вода</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{d.water_ml}</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>/ {pr.water_goal} мл</span>
        </div>
        <div className="water-track">
          <div className="water-fill" style={{ width: waterPct + '%' }}/>
        </div>
        <div className="water-btns">
          {[100, 200, 250, 500].map(ml => (
            <button key={ml} className="water-btn"
              onClick={() => logWater({ day: day.format('YYYY-MM-DD'), amount_ml: ml }).then(load)}>
              +{ml}
            </button>
          ))}
        </div>
      </div>

      {/* Подсказки */}
      <div className="tips-block">
        <div className="tips-header" onClick={() => setTipsOpen(o => !o)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2} strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span className="tips-title">Подсказки</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={2.5} strokeLinecap="round">
            <path d={tipsOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/>
          </svg>
        </div>
        {tipsOpen && TIPS.map((t, i) => (
          <div key={i} className="tips-item" style={{ marginTop: i === 0 ? 8 : 0 }}>{t}</div>
        ))}
      </div>

      {/* Приёмы пищи */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-label">Приёмы пищи</div>
        {groups.length === 0
          ? (
            <div className="empty" style={{ paddingTop: 20, paddingBottom: 20 }}>
              <div className="empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div className="empty-title">Пока пусто</div>
              <div className="empty-text">Нажми + чтобы добавить приём пищи</div>
            </div>
          )
          : groups.map(g => (
            <div key={g.type}>
              <div className="meal-group-label">{g.type}</div>
              {g.items.map(m => (
                <div key={m.id} className="meal-item">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: 'var(--text2)',
                  }}>
                    {MealIcons[g.type]}
                  </div>
                  <div className="meal-info">
                    <div className="meal-name">{m.name}</div>
                    <div className="meal-macro">Б:{m.protein}г · Ж:{m.fat}г · У:{m.carbs}г</div>
                  </div>
                  <span className="meal-cal">{m.calories}</span>
                  <button className="meal-del" onClick={() => deleteMeal(m.id).then(load)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))
        }
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setModal(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {/* Модалка */}
      {modal && (
        <AddModal
          onClose={() => setModal(false)}
          onAdd={meal => addMeal({ ...meal, day: day.format('YYYY-MM-DD') }).then(load)}
        />
      )}
    </>
  )
}