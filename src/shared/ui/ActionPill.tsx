import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface ActionPillProps {
  label: string
  icon: ReactNode
  onClick: () => void
  /** The action's own colour, painted through `sw-tint` when the pill is on. */
  accent?: string
  /** `on` wears the accent; `off` stays neutral until chosen. */
  on?: boolean
  disabled?: boolean
  /** A trailing glyph — a plus on an addable action, say. */
  trailing?: ReactNode
  'aria-label'?: string
  'aria-pressed'?: boolean
  className?: string
}

/**
 * A configurable action as a tappable pill: icon, name, and its accent colour when active. The
 * one shape both the swipe and select-toolbar editors offer their palettes in.
 */
export function ActionPill({
  label,
  icon,
  onClick,
  accent,
  on = true,
  disabled,
  trailing,
  className,
  ...aria
}: ActionPillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={on && accent ? ({ '--sw': accent } as CSSProperties) : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-(length:--p-text-label) font-semibold',
        'transition-[transform,background-color,color,opacity] active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
        on && accent ? 'sw-tint' : 'bg-secondary/40 text-muted-foreground',
        disabled && 'opacity-40',
        className,
      )}
      {...aria}
    >
      <span className="grid size-4 place-items-center [&_svg]:size-3.5">{icon}</span>
      {label}
      {trailing}
    </button>
  )
}

/** "3 / 4" — how much of a capped list is used, tinted once it is full. */
export function SlotCount({ children, full }: { children: ReactNode; full: boolean }) {
  return (
    <span
      className={cn(
        'rounded-pill px-2 py-0.5 text-(length:--p-text-tiny) font-bold tabular-nums',
        full ? 'bg-info-surface text-info-foreground' : 'bg-secondary/50 text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}
