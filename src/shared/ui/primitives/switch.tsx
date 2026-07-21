import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/shared/lib'

const trackBase = 'relative h-7 w-12 shrink-0 rounded-full transition-colors'
const trackOff = 'bg-[color-mix(in_oklch,var(--text-muted)_32%,transparent)]'
const thumbBase = 'absolute top-0.5 block size-6 rounded-full bg-card shadow-rest transition-transform'

/**
 * Presentational track + thumb with no interaction of its own — used where the
 * enclosing element is the control (e.g. a fully-clickable `SettingsRow`).
 */
export function SwitchTrack({ checked }: { checked: boolean }) {
  return (
    <span className={cn(trackBase, checked ? 'bg-primary' : trackOff)}>
      <span className={cn(thumbBase, checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </span>
  )
}

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  label: string
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next)}
      disabled={disabled}
      aria-label={label}
      className={cn(
        trackBase,
        'data-[unchecked]:bg-[color-mix(in_oklch,var(--text-muted)_32%,transparent)]',
        'data-[checked]:bg-primary disabled:opacity-50',
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(thumbBase, 'data-[unchecked]:translate-x-0.5 data-[checked]:translate-x-[22px]')}
      />
    </SwitchPrimitive.Root>
  )
}
