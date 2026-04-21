import React from 'react'

export default function AdminHeader({ title }) {
  const [left, right] = title.split('-')

  return (
    <div className="page-header">
      <div className="page-title">{left}-<span>{right}</span></div>
    </div>
  )
}
