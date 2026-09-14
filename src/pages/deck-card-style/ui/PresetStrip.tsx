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
 * `scroll-px-5` against the strip's own `px-5`, and it is what makes that padding survive. A snap
 * container aligns `snap-start` to its *padding box*, so the first tile came to rest flush against
 * the display edge the instant the scroll settled — the padding was there in the layout and gone
 * the moment anyone touched it. `scroll-padding` is what moves the snapport in to meet it.
 */
const STRIP =
  '-mx-5 -my-1.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-1.5 scroll-px-5 scrollbar-hide'

/**
 * A radio group, not a sortable list — ADR 0001 governs drag, and there is no drag here. It scrolls
 * horizontally with snap points so a thumb lands on a whole thumbnail.
 */
export function PresetStrip({ style, value, onChange }: PresetStripProps) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={t('cardStyle.presets')} className={STRIP}>
      {CARD_STYLE_PRESETS.map((preset) => {
        const selected = preset === value
        // Everything but the preset and the size is the draft's own, so a tile is the card this
        // choice would actually produce — the font and the alignment picked below are already in it.
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
            {/* A whole scene in miniature: the card floats inside its backdrop with room on all
                four sides, the way it does in the pane above, rather than being clipped to the
                tile's edges. What the thumb is choosing is the pair — the paper and the room. */}
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
