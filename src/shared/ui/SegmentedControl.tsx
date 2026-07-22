import { type ReactNode, useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'
import { ToggleGroup, ToggleGroupItem } from './primitives/toggle-group'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  ariaLabel?: string
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  layoutId?: string
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const PILL_SPRING = { type: 'spring', bounce: 0.15, duration: 0.45 } as const

const SEGMENT_PADDING = {
  md: 'py-3',
  sm: 'py-2',
} as const

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
    <ToggleGroup
      value={[value]}
      // Single-select: keep exactly one segment active — ignore the empty array Base UI
      // proposes when the active segment is tapped again.
      onValueChange={(next) => {
        const selected = next[0]
        if (selected) onChange(selected)
      }}
      aria-label={ariaLabel}
      className={cn('relative flex rounded-card bg-primary/[0.06] p-1', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.ariaLabel}
            className={cn(
              'relative flex flex-1 items-center justify-center rounded-control text-[length:var(--p-text-sub)] font-semibold',
              SEGMENT_PADDING[size],
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
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
