import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api, { getProfile, upsertProfile, getMe } from '../api'
import { getTheme, toggleTheme } from '../utils/theme'
import { tapHaptic, successHaptic, mediumHaptic } from '../utils/haptic'
import { getSubscription, subscribeUser, unsubscribeUser, checkPushSupport } from '../utils/push'

const GOALS = [{ v: 'lose', lKey: 'goals.lose' }, { v: 'maintain', lKey: 'goals.maintain' }, { v: 'gain', lKey: 'goals.gain' }]
const ACTS = [{ v: 'low', lKey: 'activity.low' }, { v: 'medium', lKey: 'activity.medium' }, { v: 'high', lKey: 'activity.high' }]

function calc(w, goal, act) {
  const p = Math.round(+w * 2), f = Math.round(+w * 1)
  let kcal = (+w * 10 + 6.25 * 175 - 5 * 30 + 5) * { low: 1.2, medium: 1.55, high: 1.725 }[act]
  if (goal === 'lose') kcal -= 400; if (goal === 'gain') kcal += 300
  return { calories_goal: Math.round(kcal), protein_goal: p, fat_goal: f, carbs_goal: Math.max(Math.round((kcal - p * 4 - f * 9) / 4), 50), water_goal: Math.round(+w * 30) }
}

export default function ProfilePage({ onLogout }) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState({ weight: 70, goal: 'maintain', activity: 'medium', water_goal: 2500, calories_goal: 2000, protein_goal: 150, fat_goal: 70, carbs_goal: 250 })
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('goals')
  const [saved, setSaved] = useState(false)
  const [themeMode, setThemeMode] = useState(getTheme())
  const [pushSupported, setPushSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    checkPushSupport().then(setPushSupported)
    getSubscription().then(sub => setIsSubscribed(!!sub))
  }, [])

  useEffect(() => {
    getMe().then(u => setUser(u)).catch(() => { })
    getProfile().then(p => setForm(f => ({ ...f, ...p }))).catch(() => { })
  }, [])

  const handlePushToggle = async () => {
    tapHaptic()
    if (isSubscribed) {
      await unsubscribeUser()
      setIsSubscribed(false)
    } else {
      try {
        const { data } = await api.get('/push/vapid-public-key')
        await subscribeUser(data.public_key)
        setIsSubscribed(true)
        successHaptic()
      } catch (err) {
        console.error('Push subscription failed:', err)
        alert('Не удалось включить уведомления. Проверь разрешения браузера.')
      }
    }
  }

  const testPush = async () => {
    try {
      await api.post('/push/test')
      successHaptic()
    } catch (err) {
      console.error('Push test failed:', err)
      alert(err.response?.data?.detail || 'Ошибка при отправке теста')
    }
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    await upsertProfile(form)
    successHaptic()
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="page-header"><div className="page-title">{t('profile.title').slice(0, 4)}<span>{t('profile.title').slice(4)}</span></div></div>

      {/* User card */}
      {user && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue2), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{user.name || t('profile.user')}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: 3, marginBottom: 16, gap: 2 }}>
        {[['goals', t('profile.tabs.goals')], ['settings', t('profile.tabs.settings')]].map(([tKey, l]) => (
          <button key={tKey} onClick={() => { tapHaptic(); setTab(tKey) }} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            background: tab === tKey ? 'var(--bg2)' : 'none',
            color: tab === tKey ? 'var(--text)' : 'var(--text3)',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: tab === tKey ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'goals' && <>
        <div className="card">
          <div className="card-label">{t('profile.main_data')}</div>
          <div className="form-group">
            <div className="input-label">{t('profile.weight')}</div>
            <input className="input" type="number" inputMode="decimal" value={form.weight} onChange={e => upd('weight', e.target.value)} />
          </div>
          <div className="form-group">
            <div className="input-label">{t('profile.goal')}</div>
            <div className="chip-row">
              {GOALS.map(g => <button key={g.v} onClick={() => { tapHaptic(); upd('goal', g.v) }} className={`chip${form.goal === g.v ? ' active' : ''}`}>{t(g.lKey)}</button>)}
            </div>
          </div>
          <div className="form-group">
            <div className="input-label">{t('profile.activity')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ACTS.map(a => (
                <button key={a.v} onClick={() => { tapHaptic(); upd('activity', a.v) }} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 'var(--r-sm)',
                  border: `1px solid ${form.activity === a.v ? 'var(--blue)' : 'var(--border)'}`,
                  background: form.activity === a.v ? 'var(--blue-glow)' : 'var(--bg3)',
                  color: form.activity === a.v ? 'var(--blue)' : 'var(--text2)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'center',
                }}>{t(a.lKey)}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { successHaptic(); setForm(f => ({ ...f, ...calc(f.weight, f.goal, f.activity) })); }} style={{
            width: '100%', padding: '11px 0', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--blue)', background: 'var(--blue-glow)',
            color: 'var(--blue)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t('profile.recalculate')}</button>
        </div>

        <div className="card">
          <div className="card-label">{t('profile.macros_goals')}</div>
          <div className="input-row">
            <div><div className="input-label">{t('today.calories')}</div><input className="input" type="number" value={form.calories_goal} onChange={e => upd('calories_goal', +e.target.value)} /></div>
            <div><div className="input-label">{t('today.protein')} г</div><input className="input" type="number" value={form.protein_goal} onChange={e => upd('protein_goal', +e.target.value)} /></div>
          </div>
          <div className="input-row">
            <div><div className="input-label">{t('today.fat')} г</div><input className="input" type="number" value={form.fat_goal} onChange={e => upd('fat_goal', +e.target.value)} /></div>
            <div><div className="input-label">{t('today.carbs')} г</div><input className="input" type="number" value={form.carbs_goal} onChange={e => upd('carbs_goal', +e.target.value)} /></div>
          </div>
          <div className="form-group"><div className="input-label">{t('today.water')} (мл)</div><input className="input" type="number" value={form.water_goal} onChange={e => upd('water_goal', +e.target.value)} /></div>
        </div>

        <button className="btn-primary" onClick={save} style={{ marginBottom: 8 }}>
          {saved ? t('common.saved') : t('common.save')}
        </button>
      </>}

      {tab === 'settings' && <>
        <div className="card">
          <div className="card-label">{t('profile.appearance')}</div>
          <div className="setting-row" style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }} onClick={() => {
            tapHaptic()
            setThemeMode(toggleTheme())
          }}>
            <span className="setting-label">{t('profile.theme')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontWeight: 600 }}>
              {themeMode === 'dark' ? t('profile.theme_dark') : t('profile.theme_light')}
              <div style={{
                width: 40, height: 24, borderRadius: 12, background: themeMode === 'light' ? 'var(--blue)' : 'var(--bg3)',
                position: 'relative', transition: 'background 0.2s'
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2, left: themeMode === 'light' ? 18 : 2,
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('profile.language')}</span>
            <select
              value={i18n.language}
              onChange={(e) => { tapHaptic(); i18n.changeLanguage(e.target.value) }}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 8, padding: '4px 8px',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)',
                outline: 'none',
              }}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="uk">Українська</option>
            </select>
          </div>
        </div>

        {pushSupported && (
          <div className="card">
            <div className="card-label">{t('profile.notifications')}</div>
            <div className="setting-row" style={{ cursor: 'pointer' }} onClick={handlePushToggle}>
              <span className="setting-label">{t('profile.push')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontWeight: 600 }}>
                {isSubscribed ? t('profile.push_on') : t('profile.push_off')}
                <div style={{
                  width: 40, height: 24, borderRadius: 12, background: isSubscribed ? 'var(--blue)' : 'var(--bg3)',
                  position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2, left: isSubscribed ? 18 : 2,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
            </div>
            {isSubscribed && (
              <div className="setting-row" style={{ cursor: 'pointer', marginTop: 8 }} onClick={testPush}>
                <span className="setting-label" style={{ color: 'var(--blue)' }}>{t('profile.test_push')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div className="card-label">{t('profile.account')}</div>
          <div className="setting-row"><span className="setting-label">Email</span><span className="setting-val">{user?.email}</span></div>
          <div className="setting-row" style={{ cursor: 'pointer' }} onClick={() => { mediumHaptic(); onLogout(); }}>
            <span className="setting-label" style={{ color: 'var(--red)' }}>{t('common.logout')}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>
        <div className="card">
          <div className="card-label">{t('profile.about')}</div>
          <div className="setting-row"><span className="setting-label">{t('profile.version')}</span><span className="setting-val">2.0 PWA</span></div>
          <div className="setting-row"><span className="setting-label">{t('profile.db')}</span><span className="setting-val">Open Food Facts</span></div>
          <div className="setting-row"><span className="setting-label">{t('profile.ai_engine')}</span><span className="setting-val">Gemini API</span></div>
        </div>
      </>}
    </>
  )
}
