import React from 'react'
import { mediumHaptic } from '../../../utils/haptic'
import { MealIcons } from '../../../utils/constants'

export default function MealsCard({ isOffline, groups, t, onDeleteMeal }) {
  return (
    <div className="card today-card" style={{ '--i': 2 }}>
      <div className="card-label">{t('today.meals')}</div>

      {isOffline
        ? (
          <div className="empty today-empty-compact">
            <div className="empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
                <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
              </svg>
            </div>
            <div className="empty-title">{t('common.offline')}</div>
            <div className="empty-text">{t('common.offline_desc')}</div>
          </div>
        )
        : groups.length === 0
          ? (
            <div className="empty today-empty-compact">
              <div className="empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div className="empty-title">{t('today.empty_meals')}</div>
              <div className="empty-text">{t('today.empty_meals_desc')}</div>
            </div>
          )
          : groups.map(g => (
            <div key={g.type}>
              <div className="meal-group-label">{t(`meals.${g.type}`)}</div>

              {g.items.map(m => (
                <div key={m.id} className="meal-item">
                  <div className="today-meal-icon-wrap">
                    {MealIcons[g.type]}
                  </div>

                  <div className="meal-info">
                    <div className="meal-name">{m.name}</div>
                    <div className="meal-macro">
                      {t('today.protein')[0]}:{m.protein}{t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'} · {t('today.fat')[0]}:{m.fat}{t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'} · {t('today.carbs')[0]}:{m.carbs}{t('today.ml')[0].toLowerCase() === 'м' ? 'г' : 'g'} · <span className="meal-cal">{m.calories} {t('today.calories').toLowerCase().includes('кал') ? 'ккал' : 'kcal'}</span>
                    </div>
                  </div>

                  <button
                    className="meal-del"
                    onClick={() => {
                      mediumHaptic()
                      onDeleteMeal(m.id)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
    </div>
  )
}
