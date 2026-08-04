// src/hooks/useForm.ts
import { useState, useCallback, ChangeEvent } from 'react'

type FormErrors<T> = Partial<Record<keyof T, string>>
type Validator<T>  = (values: T) => FormErrors<T>

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  validator?: Validator<T>
) {
  const [values,  setValues]  = useState<T>(initialValues)
  const [errors,  setErrors]  = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    if (validator) {
      const result = validator(values)
      setErrors(prev => ({ ...prev, [name]: result[name as keyof T] }))
    }
  }, [validator, values])

  const validate = useCallback((): boolean => {
    if (!validator) return true
    const result = validator(values)
    setErrors(result)
    setTouched(Object.fromEntries(Object.keys(values).map(k => [k, true])) as any)
    return Object.keys(result).length === 0
  }, [validator, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return { values, errors, touched, handleChange, handleBlur, validate, reset, setValues }
}
