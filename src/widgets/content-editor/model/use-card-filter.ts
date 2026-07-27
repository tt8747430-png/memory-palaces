import { useState } from 'react'
import { type CardFilter, cardFilterCount, EMPTY_CARD_FILTER, type MaturityKey } from './card-list'

export interface CardFilterControl {
  applied: CardFilter
  appliedCount: number
  clear: () => void
  sheetOpen: boolean
  open: () => void
  close: () => void
  draft: CardFilter
  draftCount: number
  toggleMaturity: (key: MaturityKey) => void
  setFlagged: (on: boolean) => void
  resetDraft: () => void
  apply: () => void
}

export function useCardFilter(): CardFilterControl {
  const [applied, setApplied] = useState<CardFilter>(EMPTY_CARD_FILTER)
  const [draft, setDraft] = useState<CardFilter>(EMPTY_CARD_FILTER)
  const [sheetOpen, setSheetOpen] = useState(false)

  return {
    applied,
    appliedCount: cardFilterCount(applied),
    clear: () => setApplied(EMPTY_CARD_FILTER),
    sheetOpen,
    open: () => {
      setDraft({ maturity: new Set(applied.maturity), flaggedOnly: applied.flaggedOnly })
      setSheetOpen(true)
    },
    close: () => setSheetOpen(false),
    draft,
    draftCount: cardFilterCount(draft),
    toggleMaturity: (key) =>
      setDraft((prev) => {
        const maturity = new Set(prev.maturity)
        if (maturity.has(key)) maturity.delete(key)
        else maturity.add(key)
        return { ...prev, maturity }
      }),
    setFlagged: (on) => setDraft((prev) => ({ ...prev, flaggedOnly: on })),
    resetDraft: () => setDraft(EMPTY_CARD_FILTER),
    apply: () => {
      setApplied({ maturity: new Set(draft.maturity), flaggedOnly: draft.flaggedOnly })
      setSheetOpen(false)
    },
  }
}
