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
          compact ? 'overflow-hidden p-2' : 'overflow-y-auto overscroll-contain p-6',
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
