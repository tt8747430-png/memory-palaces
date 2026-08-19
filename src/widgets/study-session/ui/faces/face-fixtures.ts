import { makeCard } from '@/entities/card'
import { DEFAULT_CARD_STYLE } from '@/entities/deck'
import type { StudyCard } from '../../model/types'
import type { FaceProps } from './types'

export function makeStudyCard(overrides: Partial<StudyCard> = {}): StudyCard {
  return {
    card: makeCard({
      id: 'c1',
      createdAt: new Date(0).toISOString(),
      deckId: 'd1',
      front: 'Ping',
      back: 'Pong answer here',
    }),
    deckName: 'Forum',
    deckPath: 'Forum',
    ...overrides,
  }
}

export function makeFaceProps(overrides: Partial<FaceProps> = {}): FaceProps {
  return {
    card: makeStudyCard(),
    cardStyle: DEFAULT_CARD_STYLE,
    mode: 'blur',
    prompt: 'Ping',
    answer: 'Pong answer here',
    canSpeak: false,
    wordSpaces: false,
    typeInitialsOnly: false,
    active: true,
    onSpeak: () => {},
    onFlip: () => {},
    onRevealInPlace: () => {},
    onHideInPlace: () => {},
    onChangeMode: () => {},
    onOpenGear: () => {},
    ...overrides,
  }
}
