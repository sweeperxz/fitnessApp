import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mediumHaptic, successHaptic, errorHaptic } from '../../../utils/haptic'
import { deleteWorkout } from '../../../api'

export default function WorkoutCard({ workout, repsLabel, kgLabel, noWeightLabel, onDeleted }) {
  const { t } = useTranslation()
  // Защита от двойного тапа: пока запрос в полёте, кнопка отключается.
  // Раньше delete мог отстреливаться повторно, и фронт игнорировал
  // ошибки сервера (then-only без catch).
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (deleting) return
    mediumHaptic()
    setDeleting(true)
    try {
      const resp = await deleteWorkout(workout.id)
      // axios-интерсептор при оффлайне возвращает { data: { _offline: true } }
      // и кладёт DELETE в очередь — это успех «с подсказкой».
      if (resp?.data?._offline) {
        alert(t('workouts.errors.delete_offline_queued'))
        onDeleted()
        return
      }
      successHaptic()
      onDeleted()
    } catch (err) {
      errorHaptic()
      // 404 — скорее всего, тренировку уже удалили в другой вкладке;
      // мягко ререндерим список, чтобы карточка пропала.
      if (err?.response?.status === 404) {
        onDeleted()
        return
      }
      alert(err?.response?.data?.detail || t('workouts.errors.delete_failed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="workout-card">
      <div className="workout-card-header">
        <div>
          <div className="workout-card-title">{workout.title}</div>
          {workout.notes && <div style={{ marginTop: 3, fontSize: 12, color: 'var(--text2)' }}>{workout.notes}</div>}
        </div>
        <button
          className="workout-card-del"
          onClick={handleDelete}
          disabled={deleting}
          style={deleting ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
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
