import type { CSSProperties, ReactNode } from 'react'
import {
  CARD_SCENE_SURFACE,
  type CardStyleInput,
  cardSceneChrome,
  cn,
  resolveCardScene,
  sceneTone,
  useColorScheme,
} from '@/shared/lib'
import { StatusBarScrim } from './StatusBarScrim'

export interface CardSceneProps {
  style: CardStyleInput
  className?: string
  /**
   * The scene fills the screen from its top edge and runs under the status bar — a study session,
   * the full-screen preview. A light scene then shades the clock's corner so it stays legible.
   */
  underStatusBar?: boolean
  children: ReactNode
}

export function CardScene({ style, className, underStatusBar = false, children }: CardSceneProps) {
  // The material is printed for the scheme the app is in: a preset is a scene, and a daylight
  // scene behind a dark app is the thing dark mode exists to stop.
  const scheme = useColorScheme()
  return (
    <div
      data-testid="card-scene"
      data-scene={cardSceneChrome(style, scheme)}
      style={resolveCardScene(style, scheme) as CSSProperties}
      className={cn(CARD_SCENE_SURFACE, underStatusBar && 'relative', className)}
    >
      {underStatusBar ? <StatusBarScrim tone={sceneTone(style, scheme)} /> : null}
      {children}
    </div>
  )
}
