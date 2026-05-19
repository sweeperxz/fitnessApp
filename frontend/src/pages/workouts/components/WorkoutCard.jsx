import React from 'react'
import { useTranslation } from 'react-i18next'
import { mediumHaptic, successHaptic } from '../../../utils/haptic'
import { deleteWorkout } from '../../../api'

export default function WorkoutCard({ workout, repsLabel, kgLabel, noWeightLabel, onDeleted }) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px 18px',
        marginBottom: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Шапка тренировки */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue2)" strokeWidth={2.8} strokeLinecap="round">
              <path d="M6.5 6.5h11M6.5 17.5h11M12 2v22M3 8v8M21 8v8" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{workout.title}</span>
          </div>
          {workout.notes && (
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text3)', fontWeight: 600, paddingLeft: 21 }}>
              {workout.notes}
            </div>
          )}
        </div>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text3)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s',
          }}
          className="hover-bg-target"
          onClick={() => {
            mediumHaptic()
            deleteWorkout(workout.id).then(() => {
              successHaptic()
              onDeleted()
            })
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Список упражнений */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        {(workout.exercises || []).map(exercise => (
          <div
            key={exercise.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '2px 0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--text)' }}>
                {exercise.name}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 6,
                background: 'var(--purple-glow)',
                color: 'var(--purple)',
              }}>
                {(exercise.sets || []).length} {t('workouts.stats.sets').toLowerCase()}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {(exercise.sets || []).map((set, idx) => (
                <span
                  key={set.id || idx}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2.5px 7px',
                    borderRadius: 6,
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span style={{ color: 'var(--text3)' }}>#{idx + 1}</span>
                  <span>{set.reps} × {set.weight_kg > 0 ? `${set.weight_kg}${kgLabel}` : noWeightLabel}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
