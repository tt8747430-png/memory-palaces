import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { FlyoutMenu } from './FlyoutMenu'
import type { SheetAction } from './ActionSheet'
import { cn } from '@/shared/lib'

export interface SortControlOption<T extends string> {
  value: T
  label: string
  icon: ReactNode
}

export interface SortControlProps<T extends string> {
  /** Accessible name for the menu trigger (e.g. "Sort rooms"). */
  label: string
  value: T
  options: SortControlOption<T>[]
  onChange: (value: T) => void
  className?: string
}

/** A labelled sort menu: a compact pill showing the active option (glyph + name + caret)
 * that opens an anchored flyout of the choices, the active one checked. The app's one
 * sort affordance — the Palaces, rooms, and content lists all wear it so sorting reads the
 * same everywhere. */
export function SortControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SortControlProps<T>) {
  const active = options.find((option) => option.value === value) ?? options[0]
  const actions: SheetAction[] = options.map((option) => ({
    id: option.value,
    label: option.label,
    icon: option.icon,
    selected: option.value === value,
    onSelect: () => onChange(option.value),
  }))

  return (
    <FlyoutMenu
      label={label}
      actions={actions}
      side="bottom"
      align="end"
      trigger={
        <button
          type="button"
          aria-label={label}
          className={cn(
            'group flex h-9 min-w-0 items-center gap-1.5 rounded-control bg-card pl-2.5 pr-2 shadow-rest transition-transform active:scale-[0.97]',
            className,
          )}
        >
          <span className="shrink-0 text-accent">{active?.icon}</span>
          <span className="truncate text-(length:--p-text-label) font-semibold text-heading">
            {active?.label}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open:rotate-180"
            aria-hidden
          />
        </button>
      }
    />
  )
}
