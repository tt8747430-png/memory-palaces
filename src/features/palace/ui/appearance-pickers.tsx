import { motion } from 'motion/react'
import { Check, Plus } from 'lucide-react'
import { PALACE_COLOR_OPTIONS, PALACE_ICON_OPTIONS } from '@/entities/palace'
import { cn } from '@/shared/lib'

/** The palace emoji picker — shared by the create sheet and palace settings so both
 * render identical options and never drift. */
export function IconPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (icon: string) => void
  label: string
}) {
  return (
    <div>
      <p className="mb-2 text-[length:var(--p-text-label)] font-semibold text-heading">{label}</p>
      <div className="grid grid-cols-6 gap-2.5" role="radiogroup" aria-label={label}>
        {PALACE_ICON_OPTIONS.map((option) => {
          const active = value === option
          return (
            <motion.button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(option)}
              className={cn(
                'grid aspect-square place-items-center rounded-control text-2xl transition-colors',
                active
                  ? 'bg-card shadow-rest ring-2 ring-primary'
                  : 'bg-info-surface active:bg-secondary/40',
              )}
            >
              {option}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/** The palace colour picker: ten preset gradients plus a free custom hue. Shared by the
 * create sheet and palace settings. */
export function ColorPicker({
  value,
  onChange,
  label,
  customLabel,
}: {
  value: string
  onChange: (color: string) => void
  label: string
  customLabel: string
}) {
  const isCustom = !value?.startsWith('from-')
  return (
    <div>
      <p className="mb-2 text-[length:var(--p-text-label)] font-semibold text-heading">{label}</p>
      <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-label={label}>
        {PALACE_COLOR_OPTIONS.map((option) => {
          const active = value === option.value
          return (
            <motion.button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={option.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onChange(option.value)}
              className={cn(
                'grid aspect-square place-items-center rounded-card bg-linear-to-br shadow-rest transition-transform',
                option.value,
                active && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
              )}
            >
              {active ? <Check className="size-5 text-white drop-shadow" aria-hidden /> : null}
            </motion.button>
          )
        })}

        {/* Free custom colour — a tinted "+" tile until the user picks a hue, then it
            fills with their chosen colour (their data, no literal in source). */}
        <label
          aria-label={customLabel}
          className={cn(
            'relative grid aspect-square cursor-pointer place-items-center rounded-card shadow-rest transition-transform',
            isCustom ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'bg-info-surface',
          )}
          style={
            isCustom
              ? {
                  backgroundImage: `linear-gradient(135deg, ${value}, color-mix(in oklab, ${value}, black 22%))`,
                }
              : undefined
          }
        >
          <input
            type="color"
            aria-label={customLabel}
            value={isCustom && value.startsWith('#') ? value : '#2563eb'}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          {isCustom ? (
            <Check className="size-5 text-white drop-shadow" aria-hidden />
          ) : (
            <Plus className="size-5 text-primary drop-shadow" aria-hidden />
          )}
        </label>
      </div>
    </div>
  )
}
