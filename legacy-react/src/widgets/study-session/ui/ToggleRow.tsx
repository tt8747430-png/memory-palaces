import { type ReactNode } from 'react'
import { cn } from '@/shared/lib'

export function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3 text-left transition-transform active:scale-[0.99]',
        disabled && 'opacity-50',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-heading">{icon}</span>
        <span className="min-w-0">
          <span className="block text-(length:--p-text-sub) font-semibold text-heading">
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-(length:--p-text-label) leading-snug text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-[color-mix(in_oklch,var(--text-muted)_32%,transparent)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block size-6 rounded-full bg-card shadow-rest transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
