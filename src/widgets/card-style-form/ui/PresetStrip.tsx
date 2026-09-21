import { useTranslation } from 'react-i18next'
import { CARD_STYLE_PRESETS, type CardStyle, type CardStylePreset } from '@/entities/deck'
import { cn } from '@/shared/lib'
import { CardScene } from '@/shared/ui'
import { StylePreview } from './StylePreview'

export interface PresetStripProps {
  style: CardStyle
  value: CardStylePreset
  onChange: (preset: CardStylePreset) => void
}

const STRIP =
  '-mx-5 -my-1.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-1.5 scroll-px-5 scrollbar-hide'

export function PresetStrip({ style, value, onChange }: PresetStripProps) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={t('cardStyle.presets')} className={STRIP}>
      {CARD_STYLE_PRESETS.map((preset) => {
        const selected = preset === value
        const previewStyle = { ...style, preset, textSize: 15 }
        return (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`cardStyle.preset.${preset}` as never)}
            onClick={() => onChange(preset)}
            className={cn(
              'w-24 shrink-0 snap-start overflow-hidden rounded-card transition-transform active:scale-[0.97]',
              selected ? 'ring-2 ring-accent' : 'ring-1 ring-border',
            )}
          >
            <CardScene style={previewStyle} className="grid aspect-3/4 place-items-center p-2">
              <StylePreview
                compact
                style={previewStyle}
                front="Aa"
                back="Bb"
                className="size-full rounded-card"
              />
            </CardScene>
          </button>
        )
      })}
    </div>
  )
}
