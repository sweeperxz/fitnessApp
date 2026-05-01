import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { successHaptic, tapHaptic } from '../utils/haptic'

export default function UpdateBanner() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [updateSW, setUpdateSW] = useState(null)

  useEffect(() => {
    const handleUpdateReady = (event) => {
      setUpdateSW(() => event.detail.updateSW)
      setShow(true)
    }
    window.addEventListener('nutrio:update-ready', handleUpdateReady)
    return () => window.removeEventListener('nutrio:update-ready', handleUpdateReady)
  }, [])

  if (!show) return null

  return (
    <div className="update-banner">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{t('common.update_ready')}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{t('common.update_desc')}</div>
      </div>
      <button
        onClick={() => { successHaptic(); updateSW?.(true) }}
        style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}
      >
        {t('common.update')}
      </button>
      <button
        onClick={() => { tapHaptic(); setShow(false) }}
        style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}
      >
        ×
      </button>
    </div>
  )
}
