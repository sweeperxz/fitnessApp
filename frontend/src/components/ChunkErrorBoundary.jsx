import React from 'react'
import { withTranslation } from 'react-i18next'
import { errorHaptic } from '../utils/haptic'

/**
 * Ловит ошибки lazy-load (когда чанк не загружается из-за оффлайна).
 * Сбрасывается при возврате online и при смене маршрута.
 */
class ChunkErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
    this._retryTimer = null
  }

  static getDerivedStateFromError() {
    errorHaptic()
    return { crashed: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.crashed) {
      this.setState({ crashed: false })
    }
  }

  componentDidMount() {
    window.addEventListener('online', this._retry)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this._retry)
    clearTimeout(this._retryTimer)
  }

  _retry = () => {
    this._retryTimer = setTimeout(() => this.setState({ crashed: false }), 300)
  }

  render() {
    if (!this.state.crashed) return this.props.children
    const { t } = this.props
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 14, padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'var(--bg3)',
          border: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8} strokeLinecap="round">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{t('common.offline')}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{t('common.offline_desc')}</div>
        </div>
        <button
          onClick={this._retry}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text2)', borderRadius: 10, padding: '10px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
          }}
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }
}

export const ChunkErrorBoundary = withTranslation()(ChunkErrorBoundaryClass)
