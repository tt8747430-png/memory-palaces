import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface Option<T extends string> {
  value: T
  label: string
  description?: string
  hint?: string
}

export interface OptionGroupProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<Option<T>>
  footer?: ReactNode
  className?: string
}

export function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  footer,
  className,
}: OptionGroupProps<T>) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-2 text-(length:--p-text-label) font-semibold text-heading">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="overflow-hidden rounded-card border border-border bg-card shadow-rest"
      >
        {options.map((option, i) => {
          const selected = option.value === value
          const divide = i < options.length - 1 || Boolean(footer)
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                divide && 'border-b border-border',
                selected ? 'bg-info-surface' : 'active:bg-info-surface/60',
              )}
            >
              <RadioDot selected={selected} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-(length:--p-text-body) font-semibold',
                    selected ? 'text-heading' : 'text-foreground',
                  )}
                >
                  {option.label}
                </span>
                {option.description ? (
                  <span className="block truncate text-(length:--p-text-label) text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {option.hint ? (
                <span
                  className="shrink-0 rounded-control bg-primary/[0.06] px-1.5 py-0.5 font-mono text-(length:--p-text-label) text-muted-foreground"
                  aria-hidden
                >
                  {option.hint}
                </span>
              ) : null}
            </button>
          )
        })}
        {footer}
      </div>
    </fieldset>
  )
}

export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
        selected ? 'border-primary' : 'border-border',
      )}
    >
      {selected ? <span className="size-2.5 rounded-full bg-primary" /> : null}
    </span>
  )
}
