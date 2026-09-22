import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { cardSurface } from './primitives/card'
import { SwitchTrack } from './primitives/switch'

/**
 * What the row stands on. `card` is a panel of its own on the page; `tint` sits inside a sheet or
 * a card, where the tint has a white edge to read against; `plain` is a row in someone else's
 * list. A tint straight on the page would vanish into it (CODE_STYLE §5).
 */
export type ToggleRowSurface = 'card' | 'tint' | 'plain'

const SURFACE: Record<ToggleRowSurface, string> = {
  card: cardSurface,
  tint: 'rounded-card bg-info-surface',
  plain: 'active:bg-info-surface/60',
}

export interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  icon?: ReactNode
  description?: string
  disabled?: boolean
  surface?: ToggleRowSurface
  className?: string
}

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
        SURFACE[surface],
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon ? <span className="shrink-0 text-heading">{icon}</span> : null}
        <span className="min-w-0">
          <span className="block text-body font-semibold text-heading">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-label leading-snug text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      <SwitchTrack checked={checked} />
    </button>
  )
}
