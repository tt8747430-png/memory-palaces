import { type SyntheticEvent, useState } from 'react'

export type FieldErrors<K extends string> = Partial<Record<K, string>>

export interface ValidatedSubmit<K extends string> {
  errors: FieldErrors<K>
  busy: boolean
  onSubmit: (event: SyntheticEvent) => void
}

export function useValidatedSubmit<K extends string>(
  validate: () => FieldErrors<K>,
  submit: () => void | Promise<void>,
): ValidatedSubmit<K> {
  const [errors, setErrors] = useState<FieldErrors<K>>({})
  const [busy, setBusy] = useState(false)

  return {
    errors,
    busy,
    onSubmit: (event: SyntheticEvent) => {
      event.preventDefault()
      if (busy) return
      const next = validate()
      setErrors(next)
      if (Object.values(next).some(Boolean)) return
      setBusy(true)
      void Promise.resolve(submit()).finally(() => setBusy(false))
    },
  }
}
