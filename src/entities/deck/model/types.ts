import {
  CARD_ALIGNMENT_IDS,
  CARD_FONT_IDS,
  CARD_STYLE_PRESET_IDS,
  type CardAlignmentId,
  type CardFontId,
  type CardStyleInput,
  type CardStylePresetId,
  type Entity,
} from '@/shared/lib'

export type StudyDirection = 'front' | 'back'

export const LEARNING_ALGORITHMS = ['fast', 'spaced'] as const
export type LearningAlgorithm = (typeof LEARNING_ALGORITHMS)[number]

/**
 * One list, not two: the shared resolver owns what a style may be, and the entity reuses it so a
 * new preset can never exist in the renderer without being valid in a deck's settings.
 */
export const CARD_STYLE_PRESETS = CARD_STYLE_PRESET_IDS
export type CardStylePreset = CardStylePresetId

export const CARD_FONTS = CARD_FONT_IDS
export type CardFont = CardFontId

export const CARD_ALIGNMENTS = CARD_ALIGNMENT_IDS
export type CardAlignment = CardAlignmentId

export const TTS_SIDES = ['front', 'back', 'both'] as const
export type TtsSide = (typeof TTS_SIDES)[number]

export interface TtsSettings {
  side: TtsSide
  /** Playback rate, 0.5–2. */
  rate: number
}

/** The card's body text is 14–40pt; `clampCardTextSize` is the shared enforcement. */
export type CardStyle = CardStyleInput

export interface SpacedAdvanced {
  /** Minutes between the steps a new card walks before it graduates. */
  learningSteps: number[]
  graduatingInterval: number
  easyBonus: number
  maximumInterval: number
  leechThreshold: number
}

export const DEFAULT_CARD_STYLE: CardStyle = {
  preset: 'plain',
  font: 'default',
  textSize: 30,
  alignment: 'center',
}

export const DEFAULT_SPACED_ADVANCED: SpacedAdvanced = {
  learningSteps: [1, 10],
  graduatingInterval: 1,
  easyBonus: 1.3,
  maximumInterval: 36500,
  leechThreshold: 8,
}

export interface DeckSettings {
  quizTimer: boolean
  studyDirection: StudyDirection
  shuffleQuestions: boolean
  shuffleCards: boolean
  /** The master switch for read-aloud; `tts` holds how it reads. */
  textToSpeech: boolean
  algorithm: LearningAlgorithm
  newCardsPerDay: number
  maxCardsPerDay: number
  cardStyle: CardStyle
  tts: TtsSettings
  advanced: SpacedAdvanced
}

export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  quizTimer: true,
  studyDirection: 'front',
  shuffleQuestions: false,
  shuffleCards: false,
  textToSpeech: false,
  algorithm: 'spaced',
  newCardsPerDay: 10,
  maxCardsPerDay: 3000,
  cardStyle: DEFAULT_CARD_STYLE,
  tts: { side: 'both', rate: 1 },
  advanced: DEFAULT_SPACED_ADVANCED,
}

/**
 * Deck settings arrive from forms, imports and replication alike, so the invariants live here
 * rather than in any one caller. Every factory runs them; nothing else has to remember to.
 */
export function validateDeckSettings(settings: Partial<DeckSettings>): void {
  if (settings.algorithm !== undefined && !LEARNING_ALGORITHMS.includes(settings.algorithm)) {
    throw new Error(`Unknown learning algorithm: ${settings.algorithm}`)
  }
  if (settings.newCardsPerDay !== undefined && settings.newCardsPerDay < 0) {
    throw new Error('New cards per day must be >= 0')
  }
  if (settings.maxCardsPerDay !== undefined && settings.maxCardsPerDay < 0) {
    throw new Error('Max cards per day must be >= 0')
  }
  const style = settings.cardStyle
  if (style) {
    if (!CARD_STYLE_PRESETS.includes(style.preset)) {
      throw new Error(`Unknown card style preset: ${style.preset}`)
    }
    if (!CARD_FONTS.includes(style.font)) throw new Error(`Unknown card font: ${style.font}`)
    if (!CARD_ALIGNMENTS.includes(style.alignment)) {
      throw new Error(`Unknown card alignment: ${style.alignment}`)
    }
    if (style.textSize < 14 || style.textSize > 40) {
      throw new Error('Card text size must be between 14 and 40')
    }
  }
  if (settings.tts) {
    if (!TTS_SIDES.includes(settings.tts.side)) {
      throw new Error(`Unknown speech side: ${settings.tts.side}`)
    }
    if (settings.tts.rate < 0.5 || settings.tts.rate > 2) {
      throw new Error('Speech rate must be between 0.5 and 2')
    }
  }
}

export interface Deck extends Entity {
  name: string
  description: string
  icon: string
  color: string
  image?: string
  folderId: string | null
  parentId: string | null
  order: number
  favorite: boolean
  archived: boolean
  settings: Partial<DeckSettings>
}

export interface MakeDeckInput {
  id: string
  createdAt: string
  name: string
  description?: string
  icon?: string
  color?: string
  image?: string
  folderId?: string | null
  parentId?: string | null
  order?: number
  favorite?: boolean
  archived?: boolean
  settings?: Partial<DeckSettings>
}

export function makeDeck(input: MakeDeckInput): Deck {
  const name = input.name.trim()
  if (!name) throw new Error('Deck name is required')
  const order = input.order ?? 0
  if (order < 0) throw new Error('Deck order must be >= 0')
  validateDeckSettings(input.settings ?? {})
  const parentId = input.parentId ?? null
  const folderId = parentId === null ? (input.folderId ?? null) : null
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    name,
    description: input.description?.trim() ?? '',
    icon: input.icon ?? '',
    color: input.color ?? '',
    image: input.image,
    folderId,
    parentId,
    order,
    favorite: input.favorite ?? false,
    archived: input.archived ?? false,
    settings: { ...input.settings },
  }
}

export type DeckChanges = Partial<Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>>

export function updateDeck(deck: Deck, changes: DeckChanges, updatedAt: string): Deck {
  const next = { ...deck, ...changes, updatedAt }
  const name = next.name.trim()
  if (!name) throw new Error('Deck name is required')
  if (next.order < 0) throw new Error('Deck order must be >= 0')
  validateDeckSettings(next.settings)
  const folderId = next.parentId === null ? next.folderId : null
  return { ...next, name, folderId }
}
