import React from 'react'
import { mediumHaptic, successHaptic } from '../../../utils/haptic'
import { deleteWorkout } from '../../../api'

export default function WorkoutCard({ workout, repsLabel, kgLabel, noWeightLabel, onDeleted }) {
  return (
    <div className="workout-card">
      <div className="workout-card-header">
        <div>
          <div className="workout-card-title">{workout.title}</div>
          {workout.notes && <div style={{ marginTop: 3, fontSize: 12, color: 'var(--text2)' }}>{workout.notes}</div>}
        </div>
        <button
          className="workout-card-del"
          onClick={() => {
            mediumHaptic()
            deleteWorkout(workout.id).then(() => {
              successHaptic()
              onDeleted()
            })
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      {(workout.exercises || []).map(exercise => (
        <div key={exercise.id} className="exercise-row">
          <div>
            <div className="exercise-name">{exercise.name}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: 'var(--text2)' }}>{exercise.sets} × {exercise.reps} {repsLabel}</div>
          </div>
          <div className="exercise-badge">{exercise.weight_kg > 0 ? `${exercise.weight_kg} ${kgLabel}` : noWeightLabel}</div>
        </div>
      ))}
    </div>
  )
}
