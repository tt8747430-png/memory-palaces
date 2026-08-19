import type { CSSProperties } from 'react'
import type { CardStyle } from '@/entities/deck'
import { CARD_STYLE_SURFACE, CARD_STYLE_TEXT, cn, resolveCardStyle } from '@/shared/lib'

export interface StylePreviewProps {
  style: CardStyle
  front: string
  back: string
  className?: string
  compact?: boolean
}

/**
 * The card as the learner will meet it, painted from the same custom properties the study card
 * reads — so what the preview promises is what the session delivers.
 */
export function StylePreview({ style, front, back, className, compact }: StylePreviewProps) {
  const vars = resolveCardStyle(style) as CSSProperties
  return (
    <div
      style={vars}
      className={cn(
        'rounded-card-featured',
        CARD_STYLE_SURFACE,
        compact ? 'p-3' : 'p-6',
        className,
      )}
    >
      <p className={cn(CARD_STYLE_TEXT, 'leading-snug')}>{front}</p>
      <hr
        className={cn(
          'border-0 border-t [border-color:var(--card-style-ink)] opacity-20',
          compact ? 'my-2' : 'my-4',
        )}
      />
      <p className={cn(CARD_STYLE_TEXT, 'leading-snug')}>{back}</p>
    </div>
  )
}
