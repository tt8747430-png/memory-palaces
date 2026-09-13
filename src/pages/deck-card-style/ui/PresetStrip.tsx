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

/**
 * A radio group, not a sortable list — ADR 0001 governs drag, and there is no drag here. It scrolls
 * horizontally with snap points so a thumb lands on a whole thumbnail.
 */
export function PresetStrip({ style, value, onChange }: PresetStripProps) {
  const { t } = useTranslation()
  return (
    <div
      role="radiogroup"
      aria-label={t('cardStyle.presets')}
      className="-mx-5 -my-1.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-1.5 scrollbar-hide"
    >
      {CARD_STYLE_PRESETS.map((preset) => {
        const selected = preset === value
        const previewStyle = { ...style, preset, textSize: 16 }
        return (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`cardStyle.preset.${preset}` as never)}
            onClick={() => onChange(preset)}
            className={cn(
              'w-28 shrink-0 snap-start overflow-hidden rounded-card text-left transition-transform active:scale-[0.97]',
              selected ? 'ring-2 ring-accent' : 'ring-1 ring-border',
            )}
          >
            {/* The card runs to the top and side edges — at thumbnail size a margin of backdrop
                around it reads as the tile's own padding rather than as the preset's paper, and
                what the thumb is choosing is the card. It is clipped at the bottom instead, where
                the strip of scene left showing is the backdrop this preset would be studied on. */}
            <CardScene style={previewStyle} className="h-20">
              <StylePreview
                compact
                style={previewStyle}
                front="Aa"
                back="Bb"
                className="h-[calc(100%-0.625rem)] w-full rounded-none"
              />
            </CardScene>
            <span className="block truncate bg-card px-2 py-1.5 text-label font-medium text-muted-foreground">
              {t(`cardStyle.preset.${preset}` as never)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
