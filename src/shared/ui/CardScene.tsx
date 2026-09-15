import type { CSSProperties, ReactNode } from 'react'
import {
  CARD_SCENE_SURFACE,
  type CardStyleInput,
  cardSceneChrome,
  cn,
  resolveCardScene,
} from '@/shared/lib'

export interface CardSceneProps {
  style: CardStyleInput
  className?: string
  children: ReactNode
}

export function CardScene({ style, className, children }: CardSceneProps) {
  return (
    <div
      data-testid="card-scene"
      data-scene={cardSceneChrome(style)}
      style={resolveCardScene(style) as CSSProperties}
      className={cn(CARD_SCENE_SURFACE, className)}
    >
      {children}
    </div>
  )
}
