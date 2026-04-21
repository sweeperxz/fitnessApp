import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export function useFormValidation(initialValues, validationRules) {
  const { t } = useTranslation()

  const validators = useMemo(() => ({
    email: (value) => {
      if (!value) return t('validation.required')
      const regex = /^[\w.-]+@\w+\.[a-z]+(\.[a-z]+)*$/
      return regex.test(value) ? null : t('validation.email_invalid')
    },
    password: (value, minLength = 8) => {
      if (!value) return t('validation.required')
      if (value.length < minLength) return t('validation.min_chars', { count: minLength })
      if (!/[A-Z]/.test(value)) return t('validation.password_uppercase')
      if (!/[a-z]/.test(value)) return t('validation.password_lowercase')
      if (!/[0-9]/.test(value)) return t('validation.password_digit')
      return null
    },
    confirmPassword: (value, password) => {
      if (!value) return t('validation.required')
      if (value !== password) return t('validation.password_mismatch')
      return null
    },
    name: (value) => {
      if (!value?.trim()) return t('validation.required')
      if (value.trim().length < 2) return t('validation.min_chars', { count: 2 })
      return null
    },
    number: (value, min, max) => {
      if (!value) return t('validation.required')
      const num = Number(value)
      if (isNaN(num)) return t('validation.must_be_number')
      if (num < 0) return t('validation.cannot_be_negative')
      if (min !== undefined && num < min) return t('validation.min_value', { min })
      if (max !== undefined && num > max) return t('validation.max_value', { max })
      return null
    },
    positiveNumber: (value) => {
      if (!value) return t('validation.required')
      const num = Number(value)
      if (isNaN(num)) return t('validation.must_be_number')
      if (num <= 0) return t('validation.must_be_positive')
      return null
    },
    calories: (value) => {
      if (!value) return t('validation.required')
      const num = Number(value)
      if (isNaN(num)) return t('validation.must_be_number')
      if (num < 0) return t('validation.cannot_be_negative')
      if (num > 10000) return t('validation.too_large')
      return null
    },
    macros: (value) => {
      if (!value) return t('validation.required')
      const num = Number(value)
      if (isNaN(num)) return t('validation.must_be_number')
      if (num < 0) return t('validation.cannot_be_negative')
      if (num > 1000) return t('validation.too_large')
      return null
    }
  }), [t])

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
  }, [validationRules, validators])

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
