import React, { useEffect, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/**
 * BarcodeScanner — fullscreen камера-сканер
 *
 * Переписано на html5-qrcode для 100% поддержки iOS PWA и Safari,
 * так как нативный BarcodeDetector там часто заблокирован.
 */
export default function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState('starting') // starting | scanning | error
  const [errMsg, setErrMsg] = useState('')

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
          setErrMsg('Камера не найдена на устройстве.')
          return
        }

        // 2. Инициализируем сканер
        // Важно: передаем ID элемента, который уже отрендерен
        html5QrCode = new Html5Qrcode('qr-reader')

        // 3. Настройки сканера для оптимального баланса скорости и производительности
        const config = {
          fps: 10, // 10 кадров в секунду достаточно для быстрого скана, экономит батарею
          qrbox: { width: 280, height: 160 }, // Прямоугольник удобен для штрихкодов
          aspectRatio: window.innerWidth / window.innerHeight,
          formatsToSupport: [
            0,  // QR_CODE
            8,  // EAN_13 (Самый частый формат продуктов)
            7,  // EAN_8
            14, // UPC_A
            15, // UPC_E
            3,  // CODE_39
            4,  // CODE_93
            5,  // CODE_128
            11, // ITF
          ],
        }

        // 4. Запуск (выбираем заднюю камеру)
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Успех! Нашли код.
            if (!isMounted) return

            // Если включены звуки/вибрация в приложении, можно добавить navigator.vibrate(100)
            if (navigator.vibrate) navigator.vibrate(50)

            // Останавливаем сканер перед возвратом результата, чтобы не было двойных срабатываний
            html5QrCode.stop().then(() => {
              if (isMounted) onResult(decodedText)
            }).catch(() => {
              // Если стоп не удался, всё равно возвращаем результат
              if (isMounted) onResult(decodedText)
            })
          },
          (errorMessage) => {
            // Ошибки сканирования кадра происходят постоянно (код не найден в кадре)
            // Игнорируем их, чтобы не засорять логи
          }
        )

        if (isMounted) setStatus('scanning')

      } catch (err) {
        if (!isMounted) return
        setStatus('error')

        const errorString = err.toString()
        if (errorString.includes('NotAllowedError') || errorString.includes('Permission denied')) {
          setErrMsg('Доступ к камере запрещен.\nПожалуйста, разрешите доступ в настройках устройства/браузера.')
        } else if (errorString.includes('NotFoundError') || errorString.includes('Requested device not found')) {
          setErrMsg('Задняя камера не найдена или уже используется другим приложением.')
        } else if (errorString.includes('NotSupportedError')) {
          setErrMsg('Требуется безопасное соединение (HTTPS) для работы с камерой.')
        } else {
          setErrMsg(`Ошибка запуска камеры: ${err.message || errorString}`)
        }
      }
    }

    startScanner()

    // ── Очистка при размонтировании (очень важно для iOS!) ──
    return () => {
      isMounted = false
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error('Failed to stop scanner on unmount', err))
      }
    }
  }, [onResult])


  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Верхняя панель (Поверх сканера) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 12px)) 16px 12px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Сканер штрихкода</div>
          {status === 'scanning' && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Наведите в рамку
            </div>
          )}
        </div>

        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
          border: 'none', color: '#fff',
          fontSize: 20, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>

      {/* Окно для видеопотока Html5Qrcode */}
      {/* Библиотека сама создаст <video> и рамку */}
      <div
        id="qr-reader"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: status === 'error' ? 'none' : 'block'
        }}
      />

      {/* Кастомная анимация поверх стандартой рамки (если сканируем) */}
      {status === 'scanning' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          {/* Скан-линия */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 250,
            height: 150,
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: 2,
              background: '#2563eb', /* Hevy blue */
              boxShadow: '0 0 8px 2px rgba(37, 99, 235, 0.5)',
              animation: 'scanLine 2s ease-in-out infinite',
            }} />
          </div>
          <style>{`
            @keyframes scanLine {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(148px); }
            }
            /* Скрываем стандартные уродливые элементы библиотеки */
            #qr-reader__dashboard_section_csr span { color: #fff; font-family: var(--font); }
            #qr-reader__dashboard_section_swaplink { display: none !important; }
            #qr-reader { border: none !important; }
          `}</style>
        </div>
      )}

      {/* Состояния загрузки и ошибки */}
      {status === 'starting' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: '#000'
        }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#2563eb',
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
          background: '#000',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(248,113,113,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Не удалось запустить сканер</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {errMsg}
          </div>
          <button onClick={onClose} style={{
            marginTop: 24, padding: '12px 28px',
            background: '#2563eb', border: 'none', borderRadius: 10,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Вернуться назад
          </button>
        </div>
      )}

    </div>
  )
}