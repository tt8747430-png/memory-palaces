import { create } from 'zustand'
import type { ParsedCard, SrsState } from '@/shared/lib'

export type ImportSource = 'paste' | 'mindscape' | 'anki'

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

export type DraftCardEdit = Partial<Pick<DraftCard, 'front' | 'back' | 'hint' | 'tip'>>

interface ImportDraftState {
  draft: ImportDraft | null
  setDraft: (source: ImportSource, cards: ParsedCard[]) => void
  editCard: (id: string, changes: DraftCardEdit) => void
  removeCard: (id: string) => void
  clear: () => void
}

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
