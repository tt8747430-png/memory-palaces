import type { Entity } from '@/shared/lib'

export type StudyDirection = 'front' | 'back'

/**
 * Per-deck study configuration. A stored deck holds only its **overrides**
 * (`Partial<DeckSettings>`); unset fields inherit the parent deck's resolved value, falling
 * back to {@link DEFAULT_DECK_SETTINGS} at the root (ADR-0002). Resolve with
 * `resolveDeckSettings(decks, deckId, DEFAULT_DECK_SETTINGS)` from `@/shared/lib`.
 */
export interface DeckSettings {
  quizTimer: boolean
  studyDirection: StudyDirection
  shuffleQuestions: boolean
  shuffleCards: boolean
  textToSpeech: boolean
}

/** The root fallback every deck's settings resolve against. */
export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  quizTimer: true,
  studyDirection: 'front',
  shuffleQuestions: false,
  shuffleCards: false,
  textToSpeech: false,
}

/**
 * A node in the deck tree. `parentId === null` marks a top-level deck (which may be filed in a
 * folder via `folderId`); a non-null `parentId` makes it a subdeck of that deck. A deck holds
 * its own cards and any number of subdecks; studying it spans its whole subtree (ADR-0003).
 */
export interface Deck extends Entity {
  name: string
  description: string
  icon: string
  /** A preset gradient or a custom hex. */
  color: string
  /** Optional cover photo (downscaled data URL). */
  image?: string
  /** The folder a top-level deck is filed in, or null. Always null for a subdeck. */
  folderId: string | null
  /** The parent deck (makes this a subdeck), or null for a top-level deck. */
  parentId: string | null
  /** Manual sort position within its container (folder, root, or parent deck). */
  order: number
  favorite: boolean
  archived: boolean
  /** Setting overrides only; unset fields inherit the parent's resolved value. */
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
  // A subdeck belongs to its parent deck, never directly to a folder.
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

/** Mutable fields of a deck — identity and timestamps are owned by the entity. */
export type DeckChanges = Partial<Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>>

/** Apply an edit, enforcing the same invariants as {@link makeDeck}. `updatedAt` is set by
 * the caller (clock injected) so the function stays pure. Keeps the folder/parent invariant:
 * a subdeck is never also filed in a folder. */
export function updateDeck(deck: Deck, changes: DeckChanges, updatedAt: string): Deck {
  const next = { ...deck, ...changes, updatedAt }
  const name = next.name.trim()
  if (!name) throw new Error('Deck name is required')
  if (next.order < 0) throw new Error('Deck order must be >= 0')
  const folderId = next.parentId === null ? next.folderId : null
  return { ...next, name, folderId }
}
