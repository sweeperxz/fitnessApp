/**
 * Юнит-тесты `useFormValidation`.
 *
 * Хук тащит `useTranslation` из `react-i18next` — мокаем его так, чтобы
 * `t(key)` возвращал ключ как строку. Это нам и нужно: мы проверяем
 * "вернулась ли ошибка для этого правила", а не текст ошибки.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
  }),
}))

import { useFormValidation } from './useFormValidation'

describe('useFormValidation', () => {
  const rules = {
    email: { type: 'email' },
    password: { type: 'password' },
    weight: { type: 'number', params: [1, 500] },
  }

  it('initial values are exposed via `values`', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: 'a@b.co', password: '', weight: 70 }, rules)
    )
    expect(result.current.values).toEqual({ email: 'a@b.co', password: '', weight: 70 })
  })

  it('isValid is false when any field violates its rule', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: 'not-an-email', password: 'short', weight: 70 }, rules)
    )
    expect(result.current.isValid).toBe(false)
  })

  it('isValid becomes true when all fields are valid', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: 'foo@bar.co', password: 'StrongP4ss', weight: 70 }, rules)
    )
    expect(result.current.isValid).toBe(true)
  })

  it('setValue updates values and validates touched fields', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', password: '', weight: 70 }, rules)
    )

    act(() => result.current.setFieldTouched('email'))
    expect(result.current.errors.email).toBe('validation.required')

    act(() => result.current.setValue('email', 'still-bad'))
    expect(result.current.errors.email).toBe('validation.email_invalid')

    act(() => result.current.setValue('email', 'good@host.io'))
    expect(result.current.errors.email).toBe(null)
  })

  it('validateAll populates errors and returns false when invalid', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', password: '', weight: 70 }, rules)
    )
    let ok
    act(() => { ok = result.current.validateAll() })
    expect(ok).toBe(false)
    expect(result.current.errors.email).toBe('validation.required')
    expect(result.current.errors.password).toBe('validation.required')
  })

  it('reset restores initial values and clears errors', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', password: '', weight: 70 }, rules)
    )
    act(() => result.current.setValue('email', 'x@y.co'))
    act(() => result.current.setFieldTouched('email'))
    act(() => result.current.reset())
    expect(result.current.values).toEqual({ email: '', password: '', weight: 70 })
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('supports custom rule as function', () => {
    const customRules = {
      pair: (value, allValues) => (value === allValues.other ? null : 'mismatch'),
      other: () => null,
    }
    const { result } = renderHook(() =>
      useFormValidation({ pair: 'a', other: 'b' }, customRules)
    )
    expect(result.current.isValid).toBe(false)
    act(() => result.current.setValue('pair', 'b'))
    expect(result.current.isValid).toBe(true)
  })

  it('number rule respects min/max bounds', () => {
    const { result } = renderHook(() =>
      useFormValidation({ weight: 70 }, { weight: { type: 'number', params: [10, 200] } })
    )
    act(() => result.current.setValue('weight', 5))
    act(() => result.current.setFieldTouched('weight'))
    expect(result.current.errors.weight).toContain('validation.min_value')

    act(() => result.current.setValue('weight', 300))
    expect(result.current.errors.weight).toContain('validation.max_value')

    act(() => result.current.setValue('weight', 80))
    expect(result.current.errors.weight).toBe(null)
  })
})
