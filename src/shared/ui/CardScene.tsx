import type { CSSProperties, ReactNode } from 'react'
import { CARD_SCENE_SURFACE, type CardStyleInput, cn, resolveCardScene } from '@/shared/lib'

export interface CardSceneProps {
  style: CardStyleInput
  className?: string
  children: ReactNode
}

/**
 * The room a card is met in: the preset's backdrop, plus the semantic tokens it hands down so the
 * chrome over it stays legible on slate or on parchment without any of that chrome knowing a scene
 * exists.
 *
 * One component for both places a scene is painted — the study session and the style page's preview
 * — so a thumbnail cannot promise a backdrop the session does not deliver. The caller brings the
 * layout; this brings the paint.
 *
 * Sheets and dialogs stay outside it: they portal to the body and belong to the app, not the deck.
 */
export function CardScene({ style, className, children }: CardSceneProps) {
  return (
    <div
      data-testid="card-scene"
      style={resolveCardScene(style) as CSSProperties}
      className={cn(CARD_SCENE_SURFACE, className)}
    >
      {children}
    </div>
  )
}
