import React, { useEffect, useRef, useState } from 'react'

/**
 * BarcodeScanner — fullscreen камера-сканер
 *
 * Использует нативный BarcodeDetector API (iOS 17.4+ Safari, Android Chrome).
 * Не требует сторонних библиотек.
 *
 * Props:
 *   onResult(code: string) — вызывается когда штрихкод найден
 *   onClose() — закрыть сканер
 */
export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const rafRef      = useRef(null)
  const detectorRef = useRef(null)
  const doneRef     = useRef(false)   // чтобы не вызвать onResult дважды

  const [status, setStatus] = useState('starting') // starting | scanning | error
  const [errMsg, setErrMsg] = useState('')
  const [torch,  setTorch]  = useState(false)

  // ── Запуск ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function start() {
      // 1. Проверяем BarcodeDetector
      if (!('BarcodeDetector' in window)) {
        setStatus('error')
        setErrMsg('Сканер не поддерживается этим браузером.\niOS: нужен Safari 17.4+.\nAndroid: Chrome работает.')
        return
      }

      // 2. Создаём детектор с нужными форматами
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar'],
        })
      } catch {
        setStatus('error')
        setErrMsg('Не удалось создать детектор штрихкодов.')
        return
      }

      // 3. Запрашиваем камеру
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setStatus('scanning')
        scan()
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        if (err.name === 'NotAllowedError') {
          setErrMsg('Нет доступа к камере.\nРазреши камеру в настройках браузера и перезагрузи страницу.')
        } else if (err.name === 'NotFoundError') {
          setErrMsg('Камера не найдена.')
        } else {
          setErrMsg(`Ошибка камеры: ${err.message}`)
        }
      }
    }

    // ── Цикл сканирования ─────────────────────────────────
    function scan() {
      rafRef.current = requestAnimationFrame(async () => {
        if (cancelled || doneRef.current) return
        const video = videoRef.current
        if (!video || video.readyState < 2) { scan(); return }

        try {
          const codes = await detectorRef.current.detect(video)
          if (codes.length > 0 && !doneRef.current) {
            doneRef.current = true
            stop()
            onResult(codes[0].rawValue)
            return
          }
        } catch { /* тихо игнорируем */ }

        scan()
      })
    }

    function stop() {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  // ── Фонарик ──────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] })
      setTorch(t => !t)
    } catch { /* не поддерживается */ }
  }

  // ── UI ───────────────────────────────────────────────────
  const supportsTorch = streamRef.current?.getVideoTracks()[0]
    ?.getCapabilities?.()?.torch ?? false

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Видео-поток */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Затемнение + рамка */}
      {status === 'scanning' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Тёмные края */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

          {/* Прозрачное окно */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -60%)',
            width: 'min(80vw, 300px)',
            height: 'min(25vw, 100px)',
            background: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            borderRadius: 8,
          }}>
            {/* Уголки */}
            {[
              { top: -2, left: -2, borderTop: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6', borderRadius: '6px 0 0 0' },
              { top: -2, right: -2, borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6', borderRadius: '0 6px 0 0' },
              { bottom: -2, left: -2, borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6', borderRadius: '0 0 0 6px' },
              { bottom: -2, right: -2, borderBottom: '3px solid #3b82f6', borderRight: '3px solid #3b82f6', borderRadius: '0 0 6px 0' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
            ))}

            {/* Скан-линия */}
            <div style={{
              position: 'absolute',
              left: 4, right: 4, height: 2,
              background: 'rgba(59,130,246,0.9)',
              borderRadius: 1,
              animation: 'scanLine 1.8s ease-in-out infinite',
            }} />
          </div>

          <style>{`
            @keyframes scanLine {
              0%,100% { top: 8%; }
              50%      { top: 88%; }
            }
          `}</style>
        </div>
      )}

      {/* Верхняя панель */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 12px)) 16px 12px',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Сканер штрихкода</div>
          {status === 'scanning' && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Наведи на штрихкод товара
            </div>
          )}
        </div>

        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: 'none', color: '#fff',
          fontSize: 20, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>

      {/* Центр — статус или ошибка */}
      {status === 'starting' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', zIndex: 1,
        }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Запускаем камеру...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Не удалось запустить</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {errMsg}
          </div>
          <button onClick={onClose} style={{
            marginTop: 24, padding: '12px 28px',
            background: '#3b82f6', border: 'none', borderRadius: 10,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Закрыть
          </button>
        </div>
      )}

      {/* Нижняя панель — фонарик */}
      {status === 'scanning' && (
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
          padding: '16px 20px',
          paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
        }}>
          {supportsTorch && (
            <button onClick={toggleTorch} style={{
              width: 48, height: 48, borderRadius: '50%',
              background: torch ? '#f59e0b' : 'rgba(255,255,255,0.12)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={torch ? '#000' : 'none'} stroke={torch ? '#000' : '#fff'} strokeWidth={2} strokeLinecap="round">
                <path d="M9 18l1 3h4l1-3"/><path d="M9 6l1-3h4l1 3"/><path d="M8 6h8l-1 6H9z"/><path d="M9 12l-3 2M15 12l3 2"/>
              </svg>
            </button>
          )}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.5 }}>
            Держи камеру над штрихкодом<br/>Убедись что освещение достаточное
          </div>
        </div>
      )}
    </div>
  )
}