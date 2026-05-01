import React from 'react'

export default React.memo(function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px', marginTop: 12 }}>
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-card" style={{ height: 140 }} />
      <div className="skeleton skeleton-card" />
    </div>
  )
})
