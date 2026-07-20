import { cn } from '@/shared/lib'

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
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </span>
  )
}

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  label: string
  className?: string
}

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
