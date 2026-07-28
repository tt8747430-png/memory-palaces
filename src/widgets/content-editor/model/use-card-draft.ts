import { useEffect, useState } from 'react'

export interface CardDraftSource {
  front: string
  back: string
  hint?: string
  tip?: string
}

export interface CardDraftEdit {
  front: string
  back: string
  hint: string | undefined
  tip: string | undefined
}

export interface CardDraft {
  front: string
  back: string
  hint: string
  tip: string
  setFront: (value: string) => void
  setBack: (value: string) => void
  setHint: (value: string) => void
  setTip: (value: string) => void
  /** Front and back both carry text. */
  valid: boolean
  /** The trimmed edit, with blank optionals dropped. */
  changes: CardDraftEdit
}

/**
 * Editable copies of a card's four fields. The draft re-seeds from `source`
 * whenever `seed` changes, so a sheet opening on a different card — or the same
 * card reopened — starts from what is stored rather than what was last typed.
 */
export function useCardDraft(source: CardDraftSource | null, seed: string | null): CardDraft {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')

  useEffect(() => {
    if (seed === null || !source) return
    setFront(source.front)
    setBack(source.back)
    setHint(source.hint ?? '')
    setTip(source.tip ?? '')
    // Re-seeding is keyed on `seed` alone. `source` changing under the same seed
    // is the user's own edit coming back around, which must not overwrite it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  return {
    front,
    back,
    hint,
    tip,
    setFront,
    setBack,
    setHint,
    setTip,
    valid: front.trim().length > 0 && back.trim().length > 0,
    changes: {
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      tip: tip.trim() || undefined,
    },
  }
}
