import { cn } from '@/shared/lib'

/** The toggle pill visual (presentational only) — shared by `Switch` and the toggle
 * variant of `SettingsRow`, which is itself the interactive element. */
export function SwitchTrack({ checked }: { checked: boolean }) {
  return (
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
  )
}

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  /** Accessible name — required since the control has no visible text of its own. */
  label: string
  className?: string
}

/** Accessible toggle for use where the label sits elsewhere (e.g. a labelled row). */
export function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn('inline-flex shrink-0 rounded-full', className)}
    >
      <SwitchTrack checked={checked} />
    </button>
  )
}
