import type { CSSProperties, ReactNode } from 'react'
import {
  CARD_SCENE_SURFACE,
  type CardStyleInput,
  cardSceneChrome,
  cn,
  resolveCardScene,
  useColorScheme,
} from '@/shared/lib'

export interface CardSceneProps {
  style: CardStyleInput
  className?: string
  children: ReactNode
}

export function CardScene({ style, className, children }: CardSceneProps) {
  // The material is printed for the scheme the app is in: a preset is a scene, and a daylight
  // scene behind a dark app is the thing dark mode exists to stop.
  const scheme = useColorScheme()
  return (
    <div
      data-testid="card-scene"
      data-scene={cardSceneChrome(style, scheme)}
      style={resolveCardScene(style, scheme) as CSSProperties}
      className={cn(CARD_SCENE_SURFACE, className)}
    >
      {children}
    </div>
  )
}
