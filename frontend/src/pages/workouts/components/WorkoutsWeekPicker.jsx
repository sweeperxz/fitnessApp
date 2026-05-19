import React from 'react'
import { tapHaptic } from '../../../utils/haptic'

export default function WorkoutsWeekPicker({ weekDays, selectedDay, onPrevWeek, onNextWeek, onSelectDay, hasWorkoutForDay }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '16px',
      marginBottom: 16,
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    }}>
      {/* Переключатель недели */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button
          onClick={() => { tapHaptic(); onPrevWeek() }}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--text2)',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'background 0.2s',
          }}
          className="hover-bg-target"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {weekDays[0].format('D')} – {weekDays[6].format('D MMM')}
        </span>

        <button
          onClick={() => { tapHaptic(); onNextWeek() }}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--text2)',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'background 0.2s',
          }}
          className="hover-bg-target"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Полоска дней недели */}
      <div style={{ display: 'flex', gap: 6 }}>
        {weekDays.map(d => {
          const isActive = d.isSame(selectedDay, 'day')
          const hasWorkout = hasWorkoutForDay(d)
          return (
            <div
              key={d.format('D')}
              onClick={() => { tapHaptic(); onSelectDay(d) }}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 2px',
                borderRadius: 12,
                border: `1px solid ${isActive ? 'var(--blue2)' : 'var(--border)'}`,
                background: isActive ? 'var(--blue-glow)' : 'var(--bg3)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 9, color: isActive ? 'var(--blue2)' : 'var(--text3)', fontWeight: 800, textTransform: 'uppercase' }}>
                {d.format('dd')}
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: isActive ? 'var(--blue2)' : 'var(--text)', marginTop: 2 }}>
                {d.format('D')}
              </div>
              {hasWorkout && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    background: isActive ? 'var(--blue2)' : 'var(--green)',
                    borderRadius: '50%',
                    margin: '3px auto 0',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
