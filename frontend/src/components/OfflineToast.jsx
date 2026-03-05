import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { onQueueChange } from '../utils/offlineQueue'

/**
 * OfflineToast — shows status messages for offline queue
 */
export default function OfflineToast() {
    const { t } = useTranslation()
    const [toast, setToast] = useState(null) // { text, type: 'offline'|'synced' }
    const timerRef = useRef(null)

    const show = useCallback((text, type = 'offline', duration = 3000) => {
        clearTimeout(timerRef.current)
        setToast({ text, type })
        timerRef.current = setTimeout(() => setToast(null), duration)
    }, [])

    useEffect(() => {
        // When items are added to queue
        const unsub = onQueueChange((size) => {
            if (size > 0) {
                show(t('common.offline_toast'), 'offline', 3000)
            }
        })

        // When we go offline
        const handleOffline = () => show(t('common.offline_toast_desc'), 'offline', 4000)

        // When synced (dispatched from api/index.js)
        const handleSynced = (e) => {
            const { synced } = e.detail || {}
            show(`${t('common.synced_toast')} (${synced})`, 'synced', 2500)
        }

        window.addEventListener('offline', handleOffline)
        window.addEventListener('nutrio:synced', handleSynced)

        return () => {
            unsub()
            clearTimeout(timerRef.current)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('nutrio:synced', handleSynced)
        }
    }, [show, t])

    if (!toast) return null

    const isOffline = toast.type === 'offline'

    return (
        <div style={{
            position: 'fixed',
            top: 'max(12px, calc(env(safe-area-inset-top, 0px) + 8px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 12,
            background: isOffline ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
            border: `1px solid ${isOffline ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            fontSize: 13,
            fontWeight: 600,
            color: isOffline ? '#fbbf24' : '#34d399',
            animation: 'toastIn 0.3s cubic-bezier(.4,0,.2,1)',
            maxWidth: 'calc(100vw - 32px)',
            fontFamily: 'var(--font)',
        }}>
            {isOffline ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            )}
            {toast.text}
            <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
        </div>
    )
}
