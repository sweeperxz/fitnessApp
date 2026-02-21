import React, { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { getNutritionDay, addMeal, deleteMeal, logWater, getProfile } from '../api'

dayjs.locale('ru')

const MEAL_TYPES = ['Завтрак','Обед','Ужин','Перекус']

// SVG иконки для типов приёмов пищи
const MealIcons = {
  Завтрак: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  Обед:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  Ужин:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Перекус: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
}

// ── Calorie Ring ─────────────────────────────────────────
function Ring({ eaten, goal }) {
  const r = 52, circ = 2*Math.PI*r
  const pct = Math.min(eaten/goal, 1)
  const dash = pct * circ
  const color = pct > 1 ? 'var(--red)' : pct > 0.85 ? 'var(--yellow)' : 'var(--accent)'
  return (
    <div className="calorie-ring">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--bg4)" strokeWidth="8"/>
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:'stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)', filter:`drop-shadow(0 0 8px ${color}88)`}}/>
      </svg>
      <div className="ring-center">
        <div className="ring-num">{Math.round(eaten)}</div>
        <div className="ring-of">из {goal}</div>
        <div className="ring-unit">ккал</div>
      </div>
    </div>
  )
}

// ── Open Food Facts ──────────────────────────────────────
function parseOFF(p) {
  const n = p.nutriments||{}
  return {
    name: p.product_name_ru||p.product_name||p.brands||'Продукт',
    brand: p.brands||'',
    calories: Math.round(n['energy-kcal_100g']||0),
    protein: Math.round(n.proteins_100g||0),
    fat: Math.round(n.fat_100g||0),
    carbs: Math.round(n.carbohydrates_100g||0),
  }
}

function SearchTab({ onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const search = async () => {
    if (!q.trim()) return
    setLoading(true); setDone(true)
    try {
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=30&fields=product_name,product_name_ua,brands,nutriments`)
      const d = await r.json()
      setResults((d.products||[]).filter(p=>p.nutriments?.['energy-kcal_100g']>0).slice(0,8).map(parseOFF))
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <input className="input" placeholder="Название продукта..." value={q}
          onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} style={{flex:1}}/>
        <button className="btn-primary" onClick={search} style={{width:'auto',padding:'0 18px'}} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      {loading && <div style={{textAlign:'center',padding:24,color:'var(--text2)',fontSize:13}}>Поиск...</div>}
      {!loading && done && !results.length && <div style={{textAlign:'center',padding:24,color:'var(--text2)',fontSize:13}}>Ничего не найдено. Попробуй на английском.</div>}
      {results.map((item,i) => (
        <div key={i} onClick={()=>onSelect(item)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
          <div style={{flex:1,marginRight:12}}>
            <div style={{fontSize:14,fontWeight:600}}>{item.name}</div>
            {item.brand && <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{item.brand}</div>}
            <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>Б:{item.protein}г · Ж:{item.fat}г · У:{item.carbs}г</div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontWeight:800,fontSize:16,color:'var(--accent)'}}>{item.calories}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>ккал/100г</div>
          </div>
        </div>
      ))}
    </>
  )
}

function BarcodeTab({ onSelect }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async (c) => {
    const bc = c||code.trim(); if (!bc) return
    setLoading(true); setError('')
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${bc}.json`)
      const d = await r.json()
      if (d.status===1&&d.product) {
        const item = parseOFF(d.product)
        if (item.calories>0) onSelect(item)
        else setError('Продукт найден, но КБЖУ отсутствуют.')
      } else setError('Продукт не найден.')
    } catch { setError('Ошибка соединения.') }
    setLoading(false)
  }

  const openCamera = async () => {
    if ('BarcodeDetector' in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
        const detector = new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']})
        const video = document.createElement('video')
        video.srcObject = stream; video.play()
        const scan = async () => {
          const bc = await detector.detect(video)
          if (bc.length>0) { stream.getTracks().forEach(t=>t.stop()); lookup(bc[0].rawValue) }
          else requestAnimationFrame(scan)
        }
        video.addEventListener('playing', scan)
      } catch { setError('Нет доступа к камере.') }
    } else { setError('BarcodeDetector не поддерживается. Введи штрихкод вручную.') }
  }

  return (
    <>
      <div onClick={openCamera} style={{border:'1.5px dashed var(--border2)',borderRadius:var_r,padding:28,textAlign:'center',marginBottom:16,background:'var(--bg3)',cursor:'pointer'}}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round" style={{margin:'0 auto 10px',display:'block'}}>
          <path d="M3 5h2M5 3v2M19 3v2M19 5h2M3 19h2M5 19v2M19 19v2M19 21h2"/>
          <rect x="7" y="7" width="10" height="10" rx="1"/>
        </svg>
        <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Сканировать штрих-код</div>
        <div style={{fontSize:12,color:'var(--text2)'}}>Нажми чтобы открыть камеру</div>
      </div>
      <div style={{fontSize:11,color:'var(--text2)',textAlign:'center',marginBottom:12}}>— или введи вручную —</div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input className="input" placeholder="4607046820011" type="number" inputMode="numeric"
          value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookup()} style={{flex:1}}/>
        <button className="btn-primary" onClick={()=>lookup()} style={{width:'auto',padding:'0 16px'}} disabled={loading}>
          {loading?'...':'Найти'}
        </button>
      </div>
      {error && <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,68,102,0.1)',border:'1px solid rgba(255,68,102,0.2)',fontSize:13,color:'#ff6680'}}>{error}</div>}
    </>
  )
}

const var_r = 'var(--r)'

function ManualTab({ initial, onAdd, onClose }) {
  const [form, setForm] = useState({meal_type:'Завтрак',name:'',calories:'',protein:'',fat:'',carbs:'',weight:'100',...(initial||{})})
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))
  const isPer100 = initial?.calories > 0
  const w = +form.weight||100
  const submit = () => {
    if (!form.name||!form.calories) return
    const ratio = isPer100 ? w/100 : 1
    onAdd({meal_type:form.meal_type,name:form.name,calories:Math.round(+form.calories*ratio),protein:Math.round(+form.protein*ratio),fat:Math.round(+form.fat*ratio),carbs:Math.round(+form.carbs*ratio)})
    onClose()
  }
  return (
    <>
      <div className="form-group">
        <div className="input-label">Приём пищи</div>
        <select className="input" value={form.meal_type} onChange={e=>upd('meal_type',e.target.value)}>
          {MEAL_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group"><div className="input-label">Название</div><input className="input" placeholder="Куриная грудка" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
      {isPer100 && (
        <div className="form-group">
          <div className="input-label">Вес порции (г)</div>
          <input className="input" type="number" inputMode="numeric" value={form.weight} onChange={e=>upd('weight',e.target.value)}/>
          <div style={{fontSize:11,color:'var(--text2)',marginTop:6}}>
            Итого: {Math.round(+form.calories*w/100)} ккал · Б:{Math.round(+form.protein*w/100)}г · Ж:{Math.round(+form.fat*w/100)}г · У:{Math.round(+form.carbs*w/100)}г
          </div>
        </div>
      )}
      <div className="input-row">
        <div><div className="input-label">{isPer100?'Ккал/100г':'Калории'}</div><input className="input" type="number" inputMode="numeric" placeholder="0" value={form.calories} onChange={e=>upd('calories',e.target.value)}/></div>
        <div><div className="input-label">{isPer100?'Белки/100г':'Белки г'}</div><input className="input" type="number" inputMode="numeric" placeholder="0" value={form.protein} onChange={e=>upd('protein',e.target.value)}/></div>
      </div>
      <div className="input-row">
        <div><div className="input-label">{isPer100?'Жиры/100г':'Жиры г'}</div><input className="input" type="number" inputMode="numeric" placeholder="0" value={form.fat} onChange={e=>upd('fat',e.target.value)}/></div>
        <div><div className="input-label">{isPer100?'Углев./100г':'Углеводы г'}</div><input className="input" type="number" inputMode="numeric" placeholder="0" value={form.carbs} onChange={e=>upd('carbs',e.target.value)}/></div>
      </div>
      <button className="btn-primary" onClick={submit} disabled={!form.name||!form.calories}>Добавить</button>
    </>
  )
}

const TABS = ['Поиск','Штрихкод','Вручную']

function AddModal({ onClose, onAdd }) {
  const [tab, setTab] = useState(0)
  const [selected, setSelected] = useState(null)
  const pick = (item) => { setSelected(item); setTab(2) }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:'92vh',display:'flex',flexDirection:'column'}}>
        <div className="modal-handle"/>
        <div className="modal-title">Добавить блюдо</div>
        <div className="food-tabs" style={{flexShrink:0}}>
          {TABS.map((t,i)=><button key={i} className={`food-tab${tab===i?' active':''}`} onClick={()=>{setTab(i);setSelected(null)}}>{t}</button>)}
        </div>
        <div style={{overflowY:'auto',flex:1,WebkitOverflowScrolling:'touch'}}>
          {tab===0 && <SearchTab onSelect={pick}/>}
          {tab===1 && <BarcodeTab onSelect={pick}/>}
          {tab===2 && <ManualTab initial={selected?{name:selected.name+(selected.brand?` (${selected.brand})`:''),calories:selected.calories,protein:selected.protein,fat:selected.fat,carbs:selected.carbs}:null} onAdd={onAdd} onClose={onClose}/>}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function TodayPage() {
  const [day, setDay] = useState(dayjs())
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [modal, setModal] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)
  const fb = {calories_goal:2000,protein_goal:150,fat_goal:70,carbs_goal:250,water_goal:2500}

  const load = useCallback(async () => {
    try {
      const [nd, pr] = await Promise.all([getNutritionDay(day.format('YYYY-MM-DD')), getProfile().catch(()=>fb)])
      setData(nd); setProfile(pr)
    } catch {
      setData({meals:[],total_calories:0,total_protein:0,total_fat:0,total_carbs:0,water_ml:0})
      setProfile(fb)
    }
  }, [day])

  useEffect(()=>{ load() }, [load])

  const pr = profile||fb
  const d  = data||{meals:[],total_calories:0,total_protein:0,total_fat:0,total_carbs:0,water_ml:0}
  const remaining = Math.max(pr.calories_goal - d.total_calories, 0)
  const waterPct  = Math.min((d.water_ml/pr.water_goal)*100, 100)
  const isToday   = day.isSame(dayjs(),'day')
  const dayLabel  = isToday ? 'Сегодня' : day.isSame(dayjs().subtract(1,'day'),'day') ? 'Вчера' : day.format('D MMMM')
  const groups    = MEAL_TYPES.map(t=>({type:t,items:d.meals.filter(m=>m.meal_type===t)})).filter(g=>g.items.length>0)

  const TIPS = [
    `Осталось ${remaining} ккал — ${remaining>400?'есть место для полноценного ужина':'лёгкий перекус'}.`,
    `Вода: ${d.water_ml} из ${pr.water_goal} мл. ${d.water_ml<pr.water_goal*0.5?'Не забывай пить воду.':'Хороший прогресс.'}`,
    `Белки: ${Math.round(d.total_protein)}/${pr.protein_goal}г — ${d.total_protein<pr.protein_goal*0.7?'добавь источник белка':'норма выполнена'}.`,
  ]

  const macros = [
    {l:'Белки',  v:d.total_protein,  g:pr.protein_goal,  c:'#a78bfa'},
    {l:'Жиры',   v:d.total_fat,      g:pr.fat_goal,      c:'var(--yellow)'},
    {l:'Углев.',  v:d.total_carbs,    g:pr.carbs_goal,    c:'var(--accent)'},
  ]

  return (
    <>
      <div className="page-header">
        <div className="page-title">Fit<span>Flow</span></div>
        <div className="date-nav">
          <button className="date-nav-btn" onClick={()=>setDay(d=>d.subtract(1,'day'))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="date-nav-label">{dayLabel}</span>
          <button className="date-nav-btn" onClick={()=>setDay(d=>d.add(1,'day'))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Calories + Macros */}
      <div className="card" style={{marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          <Ring eaten={d.total_calories} goal={pr.calories_goal}/>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:10}}>
            {macros.map(m=>(
              <div key={m.l} className="macro-row">
                <div className="macro-head">
                  <span className="macro-name">{m.l}</span>
                  <span className="macro-val">{Math.round(m.v)}<span>/{m.g}г</span></span>
                </div>
                <div className="macro-track"><div className="macro-fill" style={{width:Math.min((m.v/m.g)*100,100)+'%',background:m.c}}/></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-around',marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
          {[{l:'Съедено',v:Math.round(d.total_calories),c:'var(--accent)'},{l:'Цель',v:pr.calories_goal,c:'var(--text)'},{l:'Осталось',v:remaining,c:remaining===0?'var(--red)':'var(--accent3)'}].map(s=>(
            <div key={s.l} style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:700}}>{s.l}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.c,marginTop:2}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Water */}
      <div className="card">
        <div className="card-label">Вода</div>
        <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:0}}>
          <span className="water-val">{d.water_ml}</span>
          <span className="water-goal">/ {pr.water_goal} мл</span>
        </div>
        <div className="water-track"><div className="water-fill" style={{width:waterPct+'%'}}/></div>
        <div className="water-btns">
          {[100,200,250,500].map(ml=>(
            <button key={ml} className="water-btn" onClick={()=>logWater({day:day.format('YYYY-MM-DD'),amount_ml:ml}).then(load)}>+{ml}</button>
          ))}
        </div>
      </div>

      {/* AI Tips */}
      <div className="tips-block">
        <div className="tips-header" onClick={()=>setTipsOpen(o=>!o)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span className="tips-title">AI-подсказки</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={2.5} strokeLinecap="round"><path d={tipsOpen?"M18 15l-6-6-6 6":"M6 9l6 6 6-6"}/></svg>
        </div>
        {tipsOpen && TIPS.map((t,i)=><div key={i} className="tips-item" style={{marginTop:i===0?10:0}}>{t}</div>)}
      </div>

      {/* Meals */}
      <div className="card">
        <div className="card-label">Приёмы пищи</div>
        {groups.length===0 ? (
          <div className="empty" style={{paddingTop:20,paddingBottom:20}}>
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
            <div className="empty-title">Пока пусто</div>
            <div className="empty-text">Нажми + чтобы добавить первый приём пищи</div>
          </div>
        ) : groups.map(g=>(
          <div key={g.type}>
            <div className="meal-group-label">{g.type}</div>
            {g.items.map(m=>(
              <div key={m.id} className="meal-item">
                <div className="meal-icon">{MealIcons[g.type]}</div>
                <div className="meal-info">
                  <div className="meal-name">{m.name}</div>
                  <div className="meal-macro">Б:{m.protein}г · Ж:{m.fat}г · У:{m.carbs}г</div>
                </div>
                <span className="meal-cal">{m.calories}</span>
                <button className="meal-del" onClick={()=>deleteMeal(m.id).then(load)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="fab" onClick={()=>setModal(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
      {modal && <AddModal onClose={()=>setModal(false)} onAdd={meal=>addMeal({...meal,day:day.format('YYYY-MM-DD')}).then(load)}/>}
    </>
  )
}
