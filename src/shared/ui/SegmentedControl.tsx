import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Shared-layout id for the sliding pill; auto-generated per instance if omitted. */
  layoutId?: string
  className?: string
  'aria-label'?: string
}

const PILL_SPRING = { type: 'spring', bounce: 0.15, duration: 0.45 } as const

/** A 2+ segment toggle. A white pill springs under the active segment via shared-layout
 * animation (the bottom-nav `layoutId` idiom); reduced motion drops the slide to an
 * instant move. Track is a faint navy tint, active text the navy primary, inactive a
 * muted navy. `aria-pressed` marks the active segment for assistive tech. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
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
            className={cn(
              'relative flex-1 rounded-control py-3 text-[length:var(--p-text-sub)] font-semibold transition-colors',
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
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
