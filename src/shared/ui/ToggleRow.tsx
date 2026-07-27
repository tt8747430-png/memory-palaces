import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { SwitchTrack } from './primitives/switch'

export interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  icon?: ReactNode
  description?: string
  disabled?: boolean
  /**
   * `card` stands on its own surface; `plain` is a row inside an already-framed group and draws
   * no background of its own.
   */
  surface?: 'card' | 'plain'
  className?: string
}

/**
 * A labelled switch whose whole row is the control — the target is the full width, not the
 * 44px track. One row shape for every settings-style toggle in the app.
 */
export function ToggleRow({
  label,
  checked,
  onChange,
  icon,
  description,
  disabled,
  surface = 'card',
  className,
}: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]',
        surface === 'card' ? 'rounded-card bg-info-surface' : 'active:bg-info-surface/60',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon ? <span className="shrink-0 text-heading">{icon}</span> : null}
        <span className="min-w-0">
          <span className="block text-(length:--p-text-sub) font-semibold text-heading">
            {label}
          </span>
          {description ? (
            <span className="mt-0.5 block text-(length:--p-text-label) leading-snug text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      <SwitchTrack checked={checked} />
    </button>
  )
}
