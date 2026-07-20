import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { EmojiField } from './emoji-field'

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
  const reduce = useReducedMotion()
  return (
    <div>
      <p className="mb-2 text-[length:var(--ms-text-label)] font-semibold text-heading">{label}</p>
      <div className="flex items-center gap-3">
        <EmojiField value={icon} onChange={onIconChange} aria-label={iconLabel} />
        <span aria-hidden className="h-9 w-px shrink-0 bg-border" />
        <div
          role="radiogroup"
          aria-label={label}
          className="-my-1.5 flex flex-1 items-center gap-2.5 overflow-x-auto py-1.5 scrollbar-hide"
        >
          {colorOptions.map((option) => {
            const active = color === option.value
            return (
              <motion.button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={option.id}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                onClick={() => onColorChange(option.value)}
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br shadow-rest',
                  option.value,
                  active && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                )}
              >
                {active ? <Check className="size-4 text-white drop-shadow" aria-hidden /> : null}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
