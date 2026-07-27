import { useTranslation } from 'react-i18next'
import { BookOpen, List, Wand2 } from 'lucide-react'
import { cn, type PasteFormat } from '@/shared/lib'

export interface FormatToggleProps {
  value: PasteFormat
  auto: boolean
  onChange: (value: PasteFormat) => void
  onReset: () => void
}

const OPTIONS = [
  { value: 'notes' as const, labelKey: 'cards.paste.kindNotes', Icon: List },
  { value: 'bible' as const, labelKey: 'cards.paste.kindBible', Icon: BookOpen },
]

export function FormatToggle({ value, auto, onChange, onReset }: FormatToggleProps) {
  const { t } = useTranslation()
  const label = t('cards.paste.formatLabel')
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-(length:--p-text-label) font-semibold text-heading">{label}</span>
        {auto ? (
          <span className="inline-flex items-center gap-1 text-(length:--p-text-tiny) font-semibold text-muted-foreground">
            <Wand2 className="size-3.5" aria-hidden />
            {t('cards.paste.autoDetected')}
          </span>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="text-(length:--p-text-tiny) font-bold text-primary"
          >
            {t('cards.paste.resetAuto')}
          </button>
        )}
      </div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value: option, labelKey, Icon }) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-control py-2.5 text-(length:--p-text-sub) font-semibold transition-[background-color,box-shadow,transform] active:scale-[0.98]',
                selected
                  ? 'bg-info-surface text-heading ring-1 ring-inset ring-primary/20 shadow-rest'
                  : 'bg-secondary/40 text-muted-foreground',
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {t(labelKey as never)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
