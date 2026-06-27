import { type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'>

export interface AuthFieldProps extends NativeProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  /** Leading glyph; tints to the action color while the field has focus. */
  icon?: ReactNode
  /** Trailing control (e.g. a password visibility toggle). Wins over the valid mark. */
  rightSlot?: ReactNode
  /** Shows the success check when true and no rightSlot is present. */
  valid?: boolean
  /** Validation message; presence flips the field to its error styling. */
  error?: string
}

/**
 * Auth form field — label + glass input with a leading icon that lifts to the action
 * color on focus (CSS focus-within, no state prop drilling). Surfaces a success check
 * or an inline error, wired to the input via aria-invalid/aria-describedby. The navy
 * focus ring comes from the global :focus-visible.
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
  const errorId = useId()
  const hasError = Boolean(error)
  const showCheck = valid && !rightSlot && !hasError

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[length:var(--p-text-label)] font-medium text-heading">
        {label}
      </label>

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

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            'h-12 w-full rounded-control border bg-card-glass text-[length:var(--p-text-body)] text-foreground',
            'placeholder:text-muted-foreground transition-shadow duration-200',
            icon ? 'pl-11' : 'pl-3.5',
            rightSlot || showCheck ? 'pr-11' : 'pr-3.5',
            hasError ? 'border-[var(--danger)]' : 'border-[var(--border-glass)]',
            className,
          )}
          {...props}
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
        <p
          id={errorId}
          role="alert"
          className="text-[length:var(--p-text-label)] text-[var(--danger-on-surface)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
