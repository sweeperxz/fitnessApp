import { useState, useCallback, useMemo } from 'react'

// Validation rules
const validators = {
  email: (value) => {
    if (!value) return 'Обязательное поле'
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value) ? null : 'Неверный формат email'
  },
  password: (value, minLength = 6) => {
    if (!value) return 'Обязательное поле'
    if (value.length < minLength) return `Минимум ${minLength} символов`
    return null
  },
  confirmPassword: (value, password) => {
    if (!value) return 'Обязательное поле'
    if (value !== password) return 'Пароли не совпадают'
    return null
  },
  name: (value) => {
    if (!value?.trim()) return 'Обязательное поле'
    if (value.trim().length < 2) return 'Минимум 2 символа'
    return null
  },
  number: (value, min, max) => {
    if (!value) return 'Обязательное поле'
    const num = Number(value)
    if (isNaN(num)) return 'Должно быть числом'
    if (min !== undefined && num < min) return `Минимум ${min}`
    if (max !== undefined && num > max) return `Максимум ${max}`
    return null
  }
}

export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Validate single field - pure function without dependencies
  const getFieldError = useCallback((name, value, allValues) => {
    const rule = validationRules[name]
    if (!rule) return null

    if (typeof rule === 'function') {
      return rule(value, allValues)
    }

    if (rule.type && validators[rule.type]) {
      return validators[rule.type](value, ...(rule.params || []))
    }

    return null
  }, [validationRules])

  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {}
    Object.keys(validationRules).forEach(name => {
      const error = getFieldError(name, values[name], values)
      if (error) newErrors[name] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [validationRules, values, getFieldError])

  // Update value with instant validation
  const setValue = useCallback((name, value) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value }

      // Validate only if field was touched
      setTouched(t => {
        if (t[name]) {
          const error = getFieldError(name, value, newValues)
          setErrors(e => ({ ...e, [name]: error }))
        }
        return t
      })

      return newValues
    })
  }, [getFieldError])

  // Mark field as touched
  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))

    setValues(v => {
      const error = getFieldError(name, v[name], v)
      setErrors(e => ({ ...e, [name]: error }))
      return v
    })
  }, [getFieldError])

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(validationRules).every(name => {
      const error = getFieldError(name, values[name], values)
      return !error
    })
  }, [values, validationRules, getFieldError])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid
  }
}
