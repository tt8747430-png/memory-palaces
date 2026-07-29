import { type SyntheticEvent, useState } from 'react'

export type FieldErrors<K extends string> = Partial<Record<K, string>>

export interface ValidatedSubmit<K extends string> {
  /** What each field got wrong on the last attempt — empty until one is made. */
  errors: FieldErrors<K>
  /** True from the moment a valid submit starts until it settles. */
  busy: boolean
  onSubmit: (event: SyntheticEvent) => void
}

/**
 * The one shape of a form submit: swallow the browser's own navigation, collect
 * every field's complaint so they all surface at once rather than one per press,
 * and run `submit` only when there are none — holding `busy` from that moment so
 * a second press cannot start a second attempt.
 */
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
