import type { CSSProperties } from 'react'
import type { CardStyle } from '@/entities/deck'
import { cn, resolveCardStyle } from '@/shared/lib'

export interface StylePreviewProps {
  style: CardStyle
  front: string
  back: string
  className?: string
  compact?: boolean
}

const TEXT =
  '[color:var(--card-style-ink)] [font-family:var(--card-style-font)] ' +
  '[font-size:var(--card-style-size)] [text-align:var(--card-style-align)] leading-snug'

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
        'rounded-card-featured [background:var(--card-style-bg)] [border:var(--card-style-border)]',
        compact ? 'p-3' : 'p-6',
        className,
      )}
    >
      <p className={TEXT}>{front}</p>
      <hr
        className={cn(
          'border-0 border-t [border-color:var(--card-style-ink)] opacity-20',
          compact ? 'my-2' : 'my-4',
        )}
      />
      <p className={TEXT}>{back}</p>
    </div>
  )
}
