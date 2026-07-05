import type { Entity } from '@/shared/lib'

export type StudyDirection = 'front' | 'back'

/** Per-palace study configuration. */
export interface PalaceSettings {
  quizTimer: boolean
  studyDirection: StudyDirection
  shuffleQuestions: boolean
  shuffleCards: boolean
  textToSpeech: boolean
}

export const DEFAULT_PALACE_SETTINGS: PalaceSettings = {
  quizTimer: true,
  studyDirection: 'front',
  shuffleQuestions: false,
  shuffleCards: false,
  textToSpeech: false,
}

export interface Palace extends Entity {
  name: string
  description: string
  icon: string
  /** A preset gradient or a custom hex. */
  color: string
  /** Optional cover photo (downscaled data URL). */
  image?: string
  category: string
  settings: PalaceSettings
  /** The folder this palace is filed in, or null for the library root. */
  folderId: string | null
  /** Manual sort position within its container (folder or root). */
  order: number
  favorite: boolean
  archived: boolean
}

export interface MakePalaceInput {
  id: string
  createdAt: string
  name: string
  description?: string
  icon?: string
  color?: string
  image?: string
  category?: string
  settings?: Partial<PalaceSettings>
  folderId?: string | null
  order?: number
  favorite?: boolean
  archived?: boolean
}

export function makePalace(input: MakePalaceInput): Palace {
  const name = input.name.trim()
  if (!name) throw new Error('Palace name is required')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    name,
    description: input.description?.trim() ?? '',
    icon: input.icon ?? '',
    color: input.color ?? '',
    image: input.image,
    category: input.category ?? '',
    settings: { ...DEFAULT_PALACE_SETTINGS, ...input.settings },
    folderId: input.folderId ?? null,
    order: input.order ?? 0,
    favorite: input.favorite ?? false,
    archived: input.archived ?? false,
  }
}

/** Mutable fields of a palace — identity and timestamps are owned by the entity. */
export type PalaceChanges = Partial<Omit<Palace, 'id' | 'createdAt' | 'updatedAt'>>

/** Apply an edit, enforcing the same invariants as {@link makePalace}. `updatedAt`
 * is set by the caller (clock injected) so the function stays pure. */
export function updatePalace(palace: Palace, changes: PalaceChanges, updatedAt: string): Palace {
  const next = { ...palace, ...changes, updatedAt }
  const name = next.name.trim()
  if (!name) throw new Error('Palace name is required')
  return { ...next, name }
}
