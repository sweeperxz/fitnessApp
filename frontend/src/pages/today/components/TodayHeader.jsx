import React from 'react'
import { tapHaptic } from '../../../utils/haptic'

export default function TodayHeader({ dayLabel, onPrevDay, onNextDay }) {
  return (
    <div className="page-header">
      <div className="page-title">Nut<span>rio</span></div>
      <div className="date-nav">
        <button
          className="date-nav-btn"
          onClick={() => {
            tapHaptic()
            onPrevDay()
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span className="date-nav-label">{dayLabel}</span>

        <button
          className="date-nav-btn"
          onClick={() => {
            tapHaptic()
            onNextDay()
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
