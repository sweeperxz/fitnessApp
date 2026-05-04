import React from 'react'

/**
 * Простая пагинация для /admin/users. UI-стиль повторяет AdminStats:
 * один ряд из двух кнопок + индикатор «N–M из total» в центре.
 *
 * Кнопки делают prevent на granica страниц + disabled во время
 * actionLoading'а, чтобы не отстреливать запрос параллельно с
 * delete/role-update.
 */
export default function AdminPagination({
  page,
  pageSize,
  total,
  busy,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  rangeLabel,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)
  const canPrev = page > 0 && !busy
  const canNext = page + 1 < totalPages && !busy

  // Один экран — пагинация не нужна.
  if (total <= pageSize) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 12,
        padding: 8,
        background: 'var(--bg2)',
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: canPrev ? 'var(--bg)' : 'var(--bg2)',
          color: canPrev ? 'var(--text)' : 'var(--text2)',
          fontWeight: 700,
          cursor: canPrev ? 'pointer' : 'not-allowed',
        }}
      >
        ← {prevLabel}
      </button>
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700, textAlign: 'center' }}>
        {rangeLabel
          .replace('{{from}}', String(from))
          .replace('{{to}}', String(to))
          .replace('{{total}}', String(total))}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: canNext ? 'var(--bg)' : 'var(--bg2)',
          color: canNext ? 'var(--text)' : 'var(--text2)',
          fontWeight: 700,
          cursor: canNext ? 'pointer' : 'not-allowed',
        }}
      >
        {nextLabel} →
      </button>
    </div>
  )
}
