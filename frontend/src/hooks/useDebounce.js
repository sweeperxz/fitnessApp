import { useState, useEffect } from 'react'

/**
 * useDebounce hook - откладывает обновление значения на указанное время
 * Полезно для оптимизации поисковых запросов и других операций
 * 
 * @param {any} value - значение для debounce
 * @param {number} delay - задержка в миллисекундах
 * @returns {any} - debounced значение
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
