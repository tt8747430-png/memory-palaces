import { type ReactNode, useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  /** Accessible name for icon-only segments (where `label` carries no text). */
  ariaLabel?: string
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Shared-layout id for the sliding pill; auto-generated per instance if omitted. */
  layoutId?: string
  /** `md` (default) is the full-height toggle; `sm` is the compact in-toolbar variant. */
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const PILL_SPRING = { type: 'spring', bounce: 0.15, duration: 0.45 } as const

const SEGMENT_PADDING = {
  md: 'py-3',
  sm: 'py-2',
} as const

/** A 2+ segment toggle. A white pill springs under the active segment via shared-layout
 * animation (the bottom-nav `layoutId` idiom); reduced motion drops the slide to an
 * instant move. Track is a faint navy tint, active text the navy primary, inactive a
 * muted navy. Segments take text or icon labels (`ariaLabel` names the icon-only ones).
 * `aria-pressed` marks the active segment for assistive tech. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const autoId = useId()
  const pillId = layoutId ?? `segmented-${autoId}`

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('relative flex rounded-card bg-primary/[0.06] p-1', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            aria-label={option.ariaLabel}
            className={cn(
              'relative flex flex-1 items-center justify-center rounded-control text-[length:var(--p-text-sub)] font-semibold transition-colors',
              SEGMENT_PADDING[size],
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              isActive ? 'text-primary' : 'text-primary/50',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={pillId}
                transition={PILL_SPRING}
                aria-hidden
                className="absolute inset-0 rounded-control bg-card shadow-rest"
              />
            ) : null}
            <span className="relative z-10 flex items-center justify-center">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
