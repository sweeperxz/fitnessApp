import React, { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {
  getNutritionDay, addMeal, deleteMeal,
  logWater, getProfile, sendChatMessage,
} from '../api'
import { MEAL_TYPES, MealIcons } from '../utils/constants'
import Ring from '../components/Ring'
import AddModal from '../components/AddMeal/AddModal'

dayjs.locale('ru')

// Глобальный кэш для ИИ-советов, чтобы они не пропадали при переходе на другие вкладки
const globalAiTipsCache = {}

// ─── Main Page ────────────────────────────────────────────
export default function TodayPage() {
  const [day, setDay] = useState(dayjs())
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [modal, setModal] = useState(false)

  // Инициализируем стейт из кэша для текущего дня (по умолчанию сегодня)
  const initDateStr = dayjs().format('YYYY-MM-DD')
  const [tipsOpen, setTipsOpen] = useState(() => globalAiTipsCache[initDateStr]?.open || false)
  const [aiTips, setAiTips] = useState(() => globalAiTipsCache[initDateStr]?.tips || null)
  const [tipsLoading, setTipsLoading] = useState(false)

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

  // Обновляем ИИ-советы ИЗ КЭША при смене дня (а не просто обнуляем)
  useEffect(() => {
    const dStr = day.format('YYYY-MM-DD')
    setAiTips(globalAiTipsCache[dStr]?.tips || null)
    setTipsOpen(globalAiTipsCache[dStr]?.open || false)
  }, [day])

  const pr = profile || fb
  const d = data || { meals: [], total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, water_ml: 0 }

  const remaining = Math.max(pr.calories_goal - d.total_calories, 0)
  const waterPct = Math.min((d.water_ml / pr.water_goal) * 100, 100)
  const isToday = day.isSame(dayjs(), 'day')
  const dayLabel = isToday
    ? 'Сегодня'
    : day.isSame(dayjs().subtract(1, 'day'), 'day')
      ? 'Вчера'
      : day.format('D MMMM')

  const groups = MEAL_TYPES
    .map(t => ({ type: t, items: d.meals.filter(m => m.meal_type === t) }))
    .filter(g => g.items.length > 0)

  const macros = [
    { l: 'Белки', v: d.total_protein, g: pr.protein_goal, c: 'var(--purple)' },
    { l: 'Жиры', v: d.total_fat, g: pr.fat_goal, c: 'var(--amber)' },
    { l: 'Углев.', v: d.total_carbs, g: pr.carbs_goal, c: 'var(--blue)' },
  ]

  const loadAiTips = async () => {
    if (aiTips || tipsLoading) return
    setTipsLoading(true)
    try {
      const prompt = `Ты строгий, но полезный ИИ-нутрициолог. 
      Вот статистика пользователя за день (${dayLabel}):
      Калории: съедено ${Math.round(d.total_calories)} из ${pr.calories_goal} ккал.
      Белки: ${Math.round(d.total_protein)} из ${pr.protein_goal} г.
      Жиры: ${Math.round(d.total_fat)} из ${pr.fat_goal} г.
      Углеводы: ${Math.round(d.total_carbs)} из ${pr.carbs_goal} г.
      Вода: ${d.water_ml} из ${pr.water_goal} мл.
      Приёмы пищи: ${d.meals.map(m => m.name).join(', ') || 'Пока пусто'}.

      Твоя задача: Верни ТОЛЬКО JSON-массив из 3-х строк. Каждая строка - это короткий и персонализированный совет на текущий день, учитывая перебор или недобор КБЖУ. Без приветствий, без markdown, только валидный JSON.
      Пример: ["Отличный старт дня, но не хватает белков.", "Выпей еще стакан воды.", "На ужин лучше выбрать рыбу."]`;

      const res = await sendChatMessage({ messages: [{ role: 'user', content: prompt }] })
      const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Failed to parse AI response')
      const tipsArray = JSON.parse(jsonMatch[0])

      setAiTips(tipsArray)
      const dStr = day.format('YYYY-MM-DD')
      globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), tips: tipsArray }
    } catch (e) {
      const errTips = ["Не удалось загрузить советы от ИИ на данный момент. Попробуйте позже."]
      setAiTips(errTips)
      const dStr = day.format('YYYY-MM-DD')
      globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), tips: errTips }
    }
    setTipsLoading(false)
  }

  const handleToggleTips = () => {
    const dStr = day.format('YYYY-MM-DD')
    if (!tipsOpen) {
      setTipsOpen(true)
      globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), open: true }
      loadAiTips()
    } else {
      setTipsOpen(false)
      globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), open: false }
    }
  }

  return (
    <>
      {/* Заголовок + навигация по дням */}
      <div className="page-header">
        <div className="page-title">Nut<span>rio</span></div>
        <div className="date-nav">
          <button className="date-nav-btn" onClick={() => setDay(d => d.subtract(1, 'day'))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className="date-nav-label">{dayLabel}</span>
          <button className="date-nav-btn" onClick={() => setDay(d => d.add(1, 'day'))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Калории + макросы */}
      <div className="card" style={{ '--i': 0 }}>
        {!data
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="skeleton skeleton-circle" style={{ width: 118, height: 118, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                  <div className="skeleton skeleton-line" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-line" style={{ width: '60%' }} />
                  <div className="skeleton skeleton-line" style={{ width: '70%' }} />
                </div>
              </div>
              <div className="skeleton skeleton-line" style={{ height: 16, width: '100%' }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Ring eaten={d.total_calories} goal={pr.calories_goal} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {macros.map(m => (
                    <div key={m.l} className="macro-row">
                      <div className="macro-head">
                        <span className="macro-name">{m.l}</span>
                        <span className="macro-val">{Math.round(m.v)}<span>/{m.g}г</span></span>
                      </div>
                      <div className="macro-track">
                        <div className="macro-fill" style={{ '--fill-w': Math.min((m.v / m.g) * 100, 100) + '%', background: m.c }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                {[
                  { l: 'Съедено', v: Math.round(d.total_calories), c: 'var(--blue2)' },
                  { l: 'Цель', v: pr.calories_goal, c: 'var(--text)' },
                  { l: 'Осталось', v: remaining, c: remaining === 0 ? 'var(--red)' : 'var(--green)' },
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
      <div className="card" style={{ '--i': 1 }}>
        <div className="card-label">Вода</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{d.water_ml}</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>/ {pr.water_goal} мл</span>
        </div>
        <div className="water-track">
          <div className="water-fill" style={{ '--fill-w': waterPct + '%' }} />
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
        <div className="tips-header" onClick={handleToggleTips}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2} strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="tips-title" style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>ИИ-советы по питанию</span>
          {tipsLoading ? (
            <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--blue2)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={2.5} strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: tipsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </div>

        {tipsOpen && (
          <div style={{ marginTop: 10 }}>
            {aiTips ? (
              aiTips.map((t, i) => (
                <div key={i} className="tips-item" style={{ marginTop: i === 0 ? 0 : 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4, paddingLeft: 22, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 8, top: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--blue2)' }} />
                  {t}
                </div>
              ))
            ) : tipsLoading ? (
              <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                Генерация персональных советов...
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Приёмы пищи */}
      <div className="card" style={{ '--i': 2 }}>
        <div className="card-label">Приёмы пищи</div>
        {groups.length === 0
          ? (
            <div className="empty" style={{ paddingTop: 20, paddingBottom: 20 }}>
              <div className="empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
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
                    <div className="meal-macro">Б:{m.protein}г · Ж:{m.fat}г · У:{m.carbs}г · <span className="meal-cal">{m.calories} ккал</span></div>
                  </div>
                  <button className="meal-del" onClick={() => deleteMeal(m.id).then(load)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
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
          <path d="M12 5v14M5 12h14" />
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