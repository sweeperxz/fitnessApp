import React from 'react'
import { tapHaptic } from '../../../utils/haptic'

export default function TodayHeader({ dayLabel, onPrevDay, onNextDay }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 6 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, color: 'var(--text)' }}>
        Nut<span style={{ color: 'var(--blue2)' }}>rio</span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '2px 4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}>
        <button
          onClick={() => {
            tapHaptic()
            onPrevDay()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            transition: 'background 0.2s',
          }}
          className="hover-bg-target"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span style={{
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--text)',
          padding: '0 8px',
          minWidth: 70,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {dayLabel}
        </span>

        <button
          onClick={() => {
            tapHaptic()
            onNextDay()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
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
    </div>
  )
}
