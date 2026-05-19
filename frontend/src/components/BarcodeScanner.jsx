import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

/**
 * BarcodeScanner — fullscreen камера-сканер
 *
 * Переписано на html5-qrcode для 100% поддержки iOS PWA и Safari,
 * так как нативный BarcodeDetector там часто заблокирован.
 */
export default function BarcodeScanner({ onResult, onClose }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('starting') // starting | scanning | error
  const [errMsg, setErrMsg] = useState('')
  const onResultRef = useRef(onResult)
  
  useEffect(() => { 
    onResultRef.current = onResult 
  }, [onResult])

  useEffect(() => {
    let html5QrCode = null
    let isMounted = true

    async function startScanner() {
      try {
        // 1. Проверяем доступ к камере (запрашиваем разрешение)
        const devices = await Html5Qrcode.getCameras()
        if (!isMounted) return

        if (!devices || devices.length === 0) {
          setStatus('error')
          setErrMsg(t('meals.scanner.not_found'))
          return
        }

        // 2. Инициализируем сканер
        html5QrCode = new Html5Qrcode('qr-reader')

        // 3. Настройки сканера для оптимального баланса скорости и производительности
        const config = {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        }

        // 4. Запуск (выбираем заднюю камеру)
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isMounted) return

            // Вибрация при успешном сканировании
            if (navigator.vibrate) navigator.vibrate(50)

            // Останавливаем сканер перед возвратом результата, чтобы не было двойных срабатываний
            html5QrCode.stop().then(() => {
              if (isMounted) onResultRef.current(decodedText)
            }).catch(() => {
              if (isMounted) onResultRef.current(decodedText)
            })
          },
          () => {
            // Игнорируем ошибки кадра
          }
        )

        if (isMounted) setStatus('scanning')

      } catch (err) {
        if (!isMounted) return
        setStatus('error')

        const errorString = err.toString()
        if (errorString.includes('NotAllowedError') || errorString.includes('Permission denied')) {
          setErrMsg(t('meals.scanner.permission_denied'))
        } else if (errorString.includes('NotFoundError') || errorString.includes('Requested device not found')) {
          setErrMsg(t('meals.scanner.busy'))
        } else if (errorString.includes('NotSupportedError')) {
          setErrMsg(t('meals.scanner.https_required'))
        } else {
          setErrMsg(t('meals.scanner.start_error', { error: err.message || errorString }))
        }
      }
    }

    startScanner()

    // Очистка при размонтировании
    return () => {
      isMounted = false
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error('Failed to stop scanner on unmount', err))
      }
    }
  }, [t])


  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font)'
    }}>

      {/* Верхняя панель (Поверх сканера) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 12px)) 20px 16px',
        background: 'linear-gradient(to bottom, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.4) 60%, rgba(15,15,15,0) 100%)',
        backdropFilter: 'blur(12px)',
        webkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="12" y1="7" x2="12" y2="17" />
              <line x1="8" y1="9" x2="8" y2="15" />
              <line x1="16" y1="9" x2="16" y2="15" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              {t('meals.scanner.title')}
            </div>
          </div>
        </div>

        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
          fontSize: 20, fontWeight: 300, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        >×</button>
      </div>

      {/* Окно для видеопотока Html5Qrcode */}
      <div
        id="qr-reader"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: status === 'error' ? 'none' : 'block'
        }}
      />

      {/* Кастомная анимация и маска поверх */}
      {status === 'scanning' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          
          {/* Маска затемнения с вырезом в центре */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 280,
            height: 160,
            borderRadius: 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            border: '2.5px solid rgba(255, 255, 255, 0.2)',
          }}>
            {/* Рамка и углы с пульсацией */}
            <div style={{
              position: 'absolute',
              top: -3, left: -3,
              width: 24, height: 24,
              borderTop: '4px solid var(--blue)',
              borderLeft: '4px solid var(--blue)',
              borderTopLeftRadius: 12,
              animation: 'pulseCorner 2s infinite ease-in-out'
            }} />
            <div style={{
              position: 'absolute',
              top: -3, right: -3,
              width: 24, height: 24,
              borderTop: '4px solid var(--blue)',
              borderRight: '4px solid var(--blue)',
              borderTopRightRadius: 12,
              animation: 'pulseCorner 2s infinite ease-in-out'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -3, left: -3,
              width: 24, height: 24,
              borderBottom: '4px solid var(--blue)',
              borderLeft: '4px solid var(--blue)',
              borderBottomLeftRadius: 12,
              animation: 'pulseCorner 2s infinite ease-in-out'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -3, right: -3,
              width: 24, height: 24,
              borderBottom: '4px solid var(--blue)',
              borderRight: '4px solid var(--blue)',
              borderBottomRightRadius: 12,
              animation: 'pulseCorner 2s infinite ease-in-out'
            }} />

            {/* Светодиодная скан-линия */}
            <div style={{
              position: 'absolute',
              left: 6,
              right: 6,
              height: 2.5,
              background: 'linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,1) 50%, rgba(59,130,246,0) 100%)',
              boxShadow: '0 0 16px 4px rgba(59, 130, 246, 0.85)',
              animation: 'scanLine 2.5s ease-in-out infinite',
            }} />
          </div>

          <style>{`
            @keyframes scanLine {
              0%, 100% { top: 6px; }
              50% { top: 152px; }
            }
            @keyframes pulseCorner {
              0%, 100% { opacity: 0.8; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.04); }
            }
            /* Скрываем стандартные уродливые элементы библиотеки */
            #qr-reader__dashboard_section_csr span { color: #fff; font-family: var(--font); }
            #qr-reader__dashboard_section_swaplink { display: none !important; }
            #qr-reader { border: none !important; }
            #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
          `}</style>
        </div>
      )}

      {/* Нижняя панель подсказки */}
      {status === 'scanning' && (
        <div style={{
          position: 'absolute', bottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
          left: 20, right: 20, zIndex: 10,
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(15,15,15,0.7)',
            backdropFilter: 'blur(16px)',
            webkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '12px 20px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{t('meals.scanner.hint')}</span>
          </div>
        </div>
      )}

      {/* Состояние загрузки */}
      {status === 'starting' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: '#0f0f0f'
        }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--blue)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500 }}>
            {t('meals.scanner.starting')}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Состояние ошибки */}
      {status === 'error' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center',
          background: '#0f0f0f',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 750, marginBottom: 8, letterSpacing: '-0.3px' }}>
            {t('meals.scanner.fail')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', maxWidth: 280, margin: '0 auto 28px' }}>
            {errMsg}
          </div>
          <button 
            onClick={onClose} 
            className="btn-primary"
            style={{
              padding: '12px 32px',
              maxWidth: 200,
              fontSize: 14, 
              fontWeight: 700,
            }}
          >
            {t('meals.scanner.go_back')}
          </button>
        </div>
      )}

    </div>,
    document.body
  )
}