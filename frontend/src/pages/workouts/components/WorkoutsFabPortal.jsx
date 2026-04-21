import React from 'react'
import { createPortal } from 'react-dom'
import { mediumHaptic, successHaptic } from '../../../utils/haptic'
import { createWorkout } from '../../../api'
import NewWorkoutSheet from './NewWorkoutSheet'

export default function WorkoutsFabPortal({ modalOpen, onOpenModal, onCloseModal, day, onCreated }) {
  return createPortal(
    <>
      <button className="fab" onClick={() => { mediumHaptic(); onOpenModal() }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      {modalOpen && (
        <NewWorkoutSheet
          onClose={onCloseModal}
          onSave={payload => {
            successHaptic()
            return createWorkout(payload).then(result => {
              onCreated()
              return result
            })
          }}
          day={day}
        />
      )}
    </>,
    document.body
  )
}
