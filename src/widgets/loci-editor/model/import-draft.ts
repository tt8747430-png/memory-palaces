import { create } from 'zustand'
import type { ParsedLocus, SrsState } from '@/shared/lib'

/** Where a pending import came from — drives the review page's options (restore toggles are
 * Mindscape-only) and the confirmation copy. */
export type ImportSource = 'paste' | 'mindscape' | 'anki'

/** One reviewable card before it is written to the room. Carries a local id for list keys and
 * edits; the create command mints the persisted id on import. */
export interface DraftCard {
  id: string
  front: string
  back: string
  hint?: string
  tip?: string
  flagged?: boolean
  memorized?: boolean
  srs?: SrsState
}

export interface ImportDraft {
  source: ImportSource
  cards: DraftCard[]
}

/** Editable text fields of a draft card (identity/schedule stay fixed while reviewing). */
export type DraftCardEdit = Partial<Pick<DraftCard, 'front' | 'back' | 'hint' | 'tip'>>

interface ImportDraftState {
  draft: ImportDraft | null
  /** Seed the review with freshly parsed cards; assigns local ids. */
  setDraft: (source: ImportSource, cards: ParsedLocus[]) => void
  editCard: (id: string, changes: DraftCardEdit) => void
  removeCard: (id: string) => void
  clear: () => void
}

/**
 * Ephemeral, in-memory hand-off between an import entry point (paste "Create", or a file
 * pick) and the shared review page. Not persisted: a refresh drops the pending draft, which
 * is fine — nothing has been written to the room yet. A module singleton so it survives the
 * route change from the entry point to `/import`.
 */
export const useImportDraft = create<ImportDraftState>((set) => ({
  draft: null,
  setDraft: (source, cards) =>
    set({
      draft: {
        source,
        cards: cards.map((card) => ({ id: crypto.randomUUID(), ...card })),
      },
    }),
  editCard: (id, changes) =>
    set((state) =>
      state.draft
        ? {
            draft: {
              ...state.draft,
              cards: state.draft.cards.map((card) =>
                card.id === id ? { ...card, ...changes } : card,
              ),
            },
          }
        : state,
    ),
  removeCard: (id) =>
    set((state) =>
      state.draft
        ? { draft: { ...state.draft, cards: state.draft.cards.filter((card) => card.id !== id) } }
        : state,
    ),
  clear: () => set({ draft: null }),
}))
