import React from 'react'
import { mediumHaptic } from '../../../utils/haptic'
import { MealIcons } from '../../../utils/constants'

const GROUP_GRADIENTS = {
  Breakfast: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  Lunch: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
  Dinner: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  Snack: 'linear-gradient(135deg, #f472b6, #ec4899)',
}

export default function MealsCard({ isOffline, groups, t, onDeleteMeal }) {
  const isUk = t('today.ml')[0].toLowerCase() === 'м'

  return (
    <div className="card today-card" style={{ '--i': 2, padding: '20px' }}>
      <div className="card-label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2.5} strokeLinecap="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        {t('today.meals')}
      </div>

      {isOffline ? (
        <div className="empty today-empty-compact" style={{ padding: '24px 0', textAlign: 'center' }}>
          <div className="empty-icon" style={{ marginBottom: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8} strokeLinecap="round">
              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
            </svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text2)' }}>{t('common.offline')}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{t('common.offline_desc')}</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty today-empty-compact" style={{ padding: '32px 0', textAlign: 'center' }}>
          <div className="empty-icon" style={{ marginBottom: 8 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8} strokeLinecap="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text2)' }}>{t('today.empty_meals')}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{t('today.empty_meals_desc')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.map(g => {
            const totalCals = g.items.reduce((sum, item) => sum + (item.calories || 0), 0)
            return (
              <div key={g.type}>
                {/* Заголовок группы приемов пищи со сводкой калорий */}
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t(`meals.${g.type}`)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>
                    {totalCals} {t('today.calories').toLowerCase().includes('кал') ? 'ккал' : 'kcal'}
                  </span>
                </div>

                {/* Список блюд в группе */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.items.map(m => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        transition: 'all 0.2s',
                      }}
                      className="today-meal-row-item"
                    >
                      {/* Цветная иконка приема пищи */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: GROUP_GRADIENTS[g.type] || 'var(--bg4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        {MealIcons[g.type]}
                      </div>

                      {/* Информация о блюде */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.name}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px', marginTop: 4 }}>
                          {/* Белки */}
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1.5px 5px',
                            borderRadius: 4,
                            background: 'rgba(139, 92, 246, 0.08)',
                            color: 'var(--purple)',
                          }}>
                            {isUk ? 'Б' : 'P'}: {m.protein}г
                          </span>
                          {/* Жиры */}
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1.5px 5px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.08)',
                            color: 'var(--amber)',
                          }}>
                            {isUk ? 'Ж' : 'F'}: {m.fat}г
                          </span>
                          {/* Углеводы */}
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1.5px 5px',
                            borderRadius: 4,
                            background: 'rgba(59, 130, 246, 0.08)',
                            color: 'var(--blue2)',
                          }}>
                            {isUk ? 'У' : 'C'}: {m.carbs}г
                          </span>
                        </div>
                      </div>

                      {/* Калории и удаление */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue2)' }}>{m.calories}</span>
                          <span style={{ fontSize: 9, color: 'var(--text3)', display: 'block', fontWeight: 600 }}>ккал</span>
                        </div>

                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            transition: 'all 0.2s',
                          }}
                          className="meal-del-btn"
                          onClick={() => {
                            mediumHaptic()
                            onDeleteMeal(m.id)
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
