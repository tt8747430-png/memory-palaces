import { type InputHTMLAttributes, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Field, FieldControl, FieldError, FieldLabel } from './primitives/field'
import { Input } from './primitives/input'

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'>

export interface AuthFieldProps extends NativeProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  icon?: ReactNode
  rightSlot?: ReactNode
  valid?: boolean
  error?: string
}

/**
 * Labelled auth input on Base UI's `Field` — label↔control association, `aria-invalid`
 * and error `aria-describedby` are wired by the primitive. Keeps the glass auth look plus
 * the icon / right-slot / valid-check overlays.
 */
export function AuthField({
  id,
  label,
  value,
  onValueChange,
  icon,
  rightSlot,
  valid = false,
  error,
  className,
  type = 'text',
  ...props
}: AuthFieldProps) {
  const hasError = Boolean(error)
  const showCheck = valid && !rightSlot && !hasError

  return (
    <Field invalid={hasError}>
      <FieldLabel>{label}</FieldLabel>

      <div className="group relative">
        {icon ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200',
              'group-focus-within:text-accent [&_svg]:size-5',
              hasError && 'text-[var(--danger-on-surface)]',
            )}
          >
            {icon}
          </span>
        ) : null}

        <FieldControl
          id={id}
          render={
            <Input
              type={type}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              aria-invalid={hasError || undefined}
              className={cn(
                'h-12 border-[var(--border-glass)] bg-card-glass transition-shadow duration-200',
                icon ? 'pl-11' : 'pl-3.5',
                rightSlot || showCheck ? 'pr-11' : 'pr-3.5',
                className,
              )}
              {...props}
            />
          }
        />

        {rightSlot ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>
        ) : showCheck ? (
          <span
            aria-hidden
            className="absolute right-3.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-success text-white shadow-rest"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>

      {hasError ? (
        <FieldError match className="text-[var(--danger-on-surface)]">
          {error}
        </FieldError>
      ) : null}
    </Field>
  )
}
