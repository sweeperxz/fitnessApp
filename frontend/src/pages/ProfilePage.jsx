import React, { useState, useEffect } from 'react'
import { getProfile, upsertProfile, getMe } from '../api'

const GOALS = [{v:'lose',l:'Похудение'},{v:'maintain',l:'Поддержание'},{v:'gain',l:'Набор массы'}]
const ACTS  = [{v:'low',l:'Низкая'},{v:'medium',l:'Средняя'},{v:'high',l:'Высокая'}]

function calc(w,goal,act) {
  const p=Math.round(+w*2), f=Math.round(+w*1)
  let kcal = (+w*10+156.25*175-5*30+5) * {low:1.2,medium:1.55,high:1.725}[act]
  if (goal==='lose') kcal-=400; if (goal==='gain') kcal+=300
  return {calories_goal:Math.round(kcal),protein_goal:p,fat_goal:f,carbs_goal:Math.max(Math.round((kcal-p*4-f*9)/4),50),water_goal:Math.round(+w*30)}
}

export default function ProfilePage({ onLogout }) {
  const [form, setForm] = useState({weight:70,goal:'maintain',activity:'medium',water_goal:2500,calories_goal:2000,protein_goal:150,fat_goal:70,carbs_goal:250})
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('goals')
  const [saved, setSaved] = useState(false)
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    getMe().then(u=>setUser(u)).catch(()=>{})
    getProfile().then(p=>setForm(f=>({...f,...p}))).catch(()=>{})
  },[])

  const save = async () => {
    await upsertProfile(form)
    setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  return (
    <>
      <div className="page-header"><div className="page-title">Про<span>филь</span></div></div>

      {/* User card */}
      {user && (
        <div className="card" style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
          <div style={{
            width:50,height:50,borderRadius:'50%',
            background:'linear-gradient(135deg,var(--accent2),var(--accent))',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:20,fontWeight:800,color:'#fff',flexShrink:0,
          }}>
            {user.name?user.name[0].toUpperCase():'U'}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:800,fontSize:16}}>{user.name||'Пользователь'}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div>
          </div>
          <button onClick={onLogout} style={{
            background:'rgba(255,68,102,0.1)',border:'1px solid rgba(255,68,102,0.2)',
            color:'#ff6680',borderRadius:8,padding:'8px 12px',fontSize:12,
            fontWeight:700,cursor:'pointer',fontFamily:'var(--font)',flexShrink:0,
          }}>Выйти</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',background:'var(--bg3)',borderRadius:'var(--r-sm)',padding:3,marginBottom:16,gap:2}}>
        {[['goals','Цели'],['settings','Настройки']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:'10px 0',borderRadius:8,border:'none',
            background:tab===t?'var(--bg2)':'none',
            color:tab===t?'var(--text)':'var(--text3)',
            fontFamily:'var(--font)',fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:tab===t?'0 1px 4px rgba(0,0,0,0.4)':'none',transition:'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {tab==='goals' && <>
        <div className="card">
          <div className="card-label">Основные данные</div>
          <div className="form-group">
            <div className="input-label">Вес (кг)</div>
            <input className="input" type="number" inputMode="decimal" value={form.weight} onChange={e=>upd('weight',e.target.value)}/>
          </div>
          <div className="form-group">
            <div className="input-label">Цель</div>
            <div className="chip-row">
              {GOALS.map(g=><button key={g.v} onClick={()=>upd('goal',g.v)} className={`chip${form.goal===g.v?' active':''}`}>{g.l}</button>)}
            </div>
          </div>
          <div className="form-group">
            <div className="input-label">Активность</div>
            <div style={{display:'flex',gap:8}}>
              {ACTS.map(a=>(
                <button key={a.v} onClick={()=>upd('activity',a.v)} style={{
                  flex:1,padding:'10px 4px',borderRadius:'var(--r-sm)',
                  border:`1px solid ${form.activity===a.v?'var(--accent)':'var(--border)'}`,
                  background:form.activity===a.v?'rgba(0,212,255,0.08)':'var(--bg3)',
                  color:form.activity===a.v?'var(--accent)':'var(--text2)',
                  fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',textAlign:'center',
                }}>{a.l}</button>
              ))}
            </div>
          </div>
          <button onClick={()=>setForm(f=>({...f,...calc(f.weight,f.goal,f.activity)}))} style={{
            width:'100%',padding:'11px 0',borderRadius:'var(--r-sm)',
            border:'1px solid rgba(0,212,255,0.3)',background:'rgba(0,212,255,0.06)',
            color:'var(--accent)',fontFamily:'var(--font)',fontSize:13,fontWeight:700,cursor:'pointer',
          }}>Пересчитать цели</button>
        </div>

        <div className="card">
          <div className="card-label">Цели КБЖУ</div>
          <div className="input-row">
            <div><div className="input-label">Калории</div><input className="input" type="number" value={form.calories_goal} onChange={e=>upd('calories_goal',+e.target.value)}/></div>
            <div><div className="input-label">Белки г</div><input className="input" type="number" value={form.protein_goal} onChange={e=>upd('protein_goal',+e.target.value)}/></div>
          </div>
          <div className="input-row">
            <div><div className="input-label">Жиры г</div><input className="input" type="number" value={form.fat_goal} onChange={e=>upd('fat_goal',+e.target.value)}/></div>
            <div><div className="input-label">Углеводы г</div><input className="input" type="number" value={form.carbs_goal} onChange={e=>upd('carbs_goal',+e.target.value)}/></div>
          </div>
          <div className="form-group"><div className="input-label">Вода (мл)</div><input className="input" type="number" value={form.water_goal} onChange={e=>upd('water_goal',+e.target.value)}/></div>
        </div>

        <button className="btn-primary" onClick={save} style={{marginBottom:8}}>
          {saved?'Сохранено':'Сохранить изменения'}
        </button>
      </>}

      {tab==='settings' && <>
        <div className="card">
          <div className="card-label">Аккаунт</div>
          <div className="setting-row"><span className="setting-label">Email</span><span className="setting-val">{user?.email}</span></div>
          <div className="setting-row" style={{cursor:'pointer'}} onClick={onLogout}>
            <span className="setting-label" style={{color:'var(--red)'}}>Выйти из аккаунта</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
        <div className="card">
          <div className="card-label">О приложении</div>
          <div className="setting-row"><span className="setting-label">Версия</span><span className="setting-val">2.0 PWA</span></div>
          <div className="setting-row"><span className="setting-label">База продуктов</span><span className="setting-val">Open Food Facts</span></div>
          <div className="setting-row"><span className="setting-label">ИИ</span><span className="setting-val">Gemini API</span></div>
        </div>
      </>}
    </>
  )
}
