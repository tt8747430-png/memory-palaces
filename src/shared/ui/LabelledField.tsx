import type { ReactNode } from 'react'
import { Field, FieldError, FieldLabel } from './primitives/field'

export interface LabelledFieldProps {
  label: string
  error?: string
  children: ReactNode
}

/** A control under its label, with the error message the field is showing. */
export function LabelledField({ label, error, children }: LabelledFieldProps) {
  return (
    <Field invalid={Boolean(error)}>
      <FieldLabel className="px-1 text-(length:--p-text-label) font-medium text-muted-foreground">
        {label}
      </FieldLabel>
      {children}
      {error ? (
        <FieldError match className="px-1 text-(length:--p-text-label) text-(--danger-on-surface)">
          {error}
        </FieldError>
      ) : null}
    </Field>
  )
}
