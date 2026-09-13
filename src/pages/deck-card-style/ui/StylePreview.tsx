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
 * reads — so what the preview promises is what the study session delivers.
 *
 * The frame is the caller's size and never the text's: a card that grew a line every time the text
 * size stepped up would be reporting its own layout, not the style's. The words scroll inside the
 * border instead — an inner scroller, not a screen's scrollport, so it takes none of
 * `SCREEN_SCROLL`'s keyboard geometry and keeps the platform's own overlay bar (CODE_STYLE §11).
 * A thumbnail is too small to scroll and clips instead.
 */
export function StylePreview({ style, front, back, className, compact }: StylePreviewProps) {
  const vars = resolveCardStyle(style) as CSSProperties
  return (
    <div
      style={vars}
      className={cn(
        'flex flex-col overflow-hidden rounded-card-featured',
        CARD_STYLE_SURFACE,
        className,
      )}
    >
      <div
        className={cn(
          'min-h-0 flex-1',
          compact ? 'overflow-hidden p-3' : 'overflow-y-auto overscroll-contain p-6',
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
    </div>
  )
}
