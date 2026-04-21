import React from 'react'

export default function WorkoutsHeader({ title }) {
  return (
    <div className="page-header">
      <div className="page-title">{title.slice(0, 5)}<span>{title.slice(5)}</span></div>
    </div>
  )
}
