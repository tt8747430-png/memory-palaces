import { Minus, Plus } from 'lucide-react'
import { IconButton } from './primitives'

export interface StepperRowProps {
  label: string
  /** Already formatted — a point size, a rate with its multiplier sign. */
  value: string
  decreaseLabel: string
  increaseLabel: string
  onDecrease: () => void
  onIncrease: () => void
  canDecrease?: boolean
  canIncrease?: boolean
}

/**
 * A settings row that steps one number. Both settings surfaces that step a value use this, so the
 * two rows keep the same touch targets and the same reading order.
 */
export function StepperRow({
  label,
  value,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
  canDecrease = true,
  canIncrease = true,
}: StepperRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1 text-(length:--p-text-sub) font-semibold text-heading">
        {label}
      </span>
      <IconButton
        variant="glass"
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={onDecrease}
      >
        <Minus className="size-4.5" aria-hidden />
      </IconButton>
      <span className="min-w-12 text-center text-(length:--p-text-sub) font-semibold tabular-nums text-heading">
        {value}
      </span>
      <IconButton
        variant="glass"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={onIncrease}
      >
        <Plus className="size-4.5" aria-hidden />
      </IconButton>
    </div>
  )
}
