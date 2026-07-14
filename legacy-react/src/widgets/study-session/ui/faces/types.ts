import { type PointerEvent as ReactPointerEvent, useEffect, useRef } from 'react'
import type { StudyMode } from '@/entities/preferences'
import type { ModeSwipeAction } from '@/shared/config/flashcard-swipe'
import type { StudyCard } from '../../model/types'

export type MechanicHandlers = Partial<Record<ModeSwipeAction, () => void>>

export interface FaceProps {
  card: StudyCard
  mode: StudyMode
  prompt: string
  answer: string
  canSpeak: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  active: boolean
  onSpeak: (text: string) => void
  onFlip: () => void
  onRevealInPlace: () => void
  onHideInPlace: () => void
  onChangeMode: () => void
  onOpenGear: () => void
  registerMechanic?: (handlers: MechanicHandlers | null) => void
}

/** Controls own their press: a tap on one must never start a card drag. */
export const stopPress = (event: ReactPointerEvent) => event.stopPropagation()

/** Exposes the visible face's own actions to the swipe layer, for as long as it is visible. */
export function useSwipeMechanic(
  active: boolean,
  register: FaceProps['registerMechanic'],
  handlers: MechanicHandlers,
) {
  const ref = useRef(handlers)
  ref.current = handlers
  useEffect(() => {
    if (!active || !register) return
    register({
      hideMore: () => ref.current.hideMore?.(),
      showAll: () => ref.current.showAll?.(),
      showWords: () => ref.current.showWords?.(),
      reset: () => ref.current.reset?.(),
      nextWord: () => ref.current.nextWord?.(),
    })
    return () => register(null)
  }, [active, register])
}
