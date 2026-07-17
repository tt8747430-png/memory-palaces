import type { Entity } from '@/shared/domain'

export type StudyDirection = 'front' | 'back'

export interface DeckSettings {
  quizTimer: boolean
  studyDirection: StudyDirection
  shuffleQuestions: boolean
  shuffleCards: boolean
  textToSpeech: boolean
}

export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  quizTimer: true,
  studyDirection: 'front',
  shuffleQuestions: false,
  shuffleCards: false,
  textToSpeech: false,
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
  const folderId = next.parentId === null ? next.folderId : null
  return { ...next, name, folderId }
}
