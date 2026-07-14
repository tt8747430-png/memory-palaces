import { type ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface ComboboxOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface ComboboxProps<T extends string> {
  label: string
  value: T
  options: ComboboxOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  variant?: 'field' | 'bare'
  className?: string
}

export function Combobox<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  variant = 'field',
  className,
}: ComboboxProps<T>) {
  const selected = options.find((option) => option.value === value)
  const bare = variant === 'bare'

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        disabled={disabled}
        aria-label={label}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(
          bare
            ? 'flex min-h-11 items-center gap-1 rounded-control pl-2 -mr-1.5 pr-1.5 text-right outline-none data-[popup-open]:text-accent'
            : 'flex h-11 w-full items-center gap-2.5 rounded-control border border-border bg-card px-3.5 text-left shadow-rest data-[popup-open]:border-[oklch(var(--p-tint-navy)/0.2)]',
          'outline-none transition-[color,border-color,box-shadow] duration-150 ease-out',
          'focus-visible:ring-[3px] focus-visible:ring-ring/45',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
      >
        {selected?.icon ? (
          <span className="grid size-5 shrink-0 place-items-center text-accent" aria-hidden>
            {selected.icon}
          </span>
        ) : null}
        <span
          className={cn(
            'min-w-0 truncate text-(length:--p-text-body) font-semibold',
            bare ? 'text-heading' : 'flex-1',
            selected ? 'text-heading' : 'text-muted-foreground',
          )}
        >
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronsUpDown
          className={cn(
            'size-4 shrink-0',
            bare ? 'text-muted-foreground/70' : 'text-muted-foreground',
          )}
          aria-hidden
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align={bare ? 'end' : 'start'}
          sideOffset={6}
          collisionPadding={12}
          className={cn('z-[500]', bare ? 'min-w-[11rem]' : 'w-[var(--anchor-width)]')}
        >
          <Menu.Popup
            className={cn(
              'max-h-[min(18rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto',
              'origin-[var(--transform-origin)] rounded-card bg-card p-1.5',
              'shadow-elevated outline-none ring-1 ring-[color:var(--border-glass)]',
              'transition-[transform,opacity] duration-150 ease-out motion-reduce:transition-none',
              'data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0',
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <Menu.Item
                  key={option.value}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    'flex h-11 cursor-default select-none items-center gap-3 rounded-control px-3',
                    'text-[length:var(--p-text-body)] font-medium outline-none',
                    'transition-transform duration-150 ease-out active:scale-[0.99]',
                    'data-[highlighted]:bg-info-surface',
                    isSelected ? 'text-accent' : 'text-heading',
                  )}
                >
                  {option.icon ? (
                    <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="size-[18px] shrink-0 text-accent" aria-hidden />
                  ) : null}
                </Menu.Item>
              )
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
