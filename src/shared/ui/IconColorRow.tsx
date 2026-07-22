import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { EmojiField } from './EmojiField'
import { ToggleGroup, ToggleGroupItem } from './primitives/toggle-group'

export interface ColorOption {
  id: string
  value: string
}

export interface IconColorRowProps {
  icon: string
  color: string
  onIconChange: (icon: string) => void
  onColorChange: (color: string) => void
  colorOptions: readonly ColorOption[]
  label: string
  iconLabel: string
}

export function IconColorRow({
  icon,
  color,
  onIconChange,
  onColorChange,
  colorOptions,
  label,
  iconLabel,
}: IconColorRowProps) {
  return (
    <div>
      <p className="mb-2 text-[length:var(--p-text-label)] font-semibold text-heading">{label}</p>
      <div className="flex items-center gap-3">
        <EmojiField value={icon} onChange={onIconChange} aria-label={iconLabel} />
        <span aria-hidden className="h-9 w-px shrink-0 bg-border" />
        <ToggleGroup
          value={[color]}
          onValueChange={(next) => {
            const selected = next[0]
            if (selected) onColorChange(selected)
          }}
          aria-label={label}
          className="-my-1.5 flex flex-1 items-center gap-2.5 overflow-x-auto py-1.5 scrollbar-hide"
        >
          {colorOptions.map((option) => {
            const active = color === option.value
            return (
              <ToggleGroupItem
                key={option.id}
                value={option.value}
                aria-label={option.id}
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br shadow-rest',
                  'transition-transform active:scale-90 motion-reduce:active:scale-100',
                  option.value,
                  'data-[pressed]:ring-2 data-[pressed]:ring-primary data-[pressed]:ring-offset-2 data-[pressed]:ring-offset-card',
                )}
              >
                {active ? <Check className="size-4 text-white drop-shadow" aria-hidden /> : null}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>
    </div>
  )
}
