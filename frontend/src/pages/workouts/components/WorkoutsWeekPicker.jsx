import React from 'react'
import { tapHaptic } from '../../../utils/haptic'

export default function WorkoutsWeekPicker({ weekDays, selectedDay, onPrevWeek, onNextWeek, onSelectDay, hasWorkoutForDay }) {
  return (
    <div className="card">
      <div className="week-nav">
        <button className="week-nav-btn" onClick={() => { tapHaptic(); onPrevWeek() }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span className="week-label">{weekDays[0].format('D')} – {weekDays[6].format('D MMM')}</span>
        <button className="week-nav-btn" onClick={() => { tapHaptic(); onNextWeek() }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div className="week-strip">
        {weekDays.map(d => (
          <div key={d.format('D')} className={`week-day${d.isSame(selectedDay, 'day') ? ' active' : ''}`} onClick={() => { tapHaptic(); onSelectDay(d) }}>
            <div className="week-day-name">{d.format('dd').toUpperCase()}</div>
            <div className="week-day-num">{d.format('D')}</div>
            {hasWorkoutForDay(d) && <div className="week-dot" />}
          </div>
        ))}
      </div>
    </div>
  )
}
