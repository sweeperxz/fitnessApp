import React from 'react'
import ReactDOM from 'react-dom'
import AddModal from '../../../components/AddMeal/AddModal'
import { mediumHaptic, successHaptic } from '../../../utils/haptic'

export default function TodayFabPortal({ modalOpen, onOpenModal, onCloseModal, onAddMeal }) {
  return ReactDOM.createPortal(
    <>
      <button
        className="fab"
        onClick={() => {
          mediumHaptic()
          onOpenModal()
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {modalOpen && (
        <AddModal
          onClose={onCloseModal}
          onAdd={async (meal) => {
            successHaptic()
            await onAddMeal(meal)
          }}
        />
      )}
    </>,
    document.body,
  )
}
