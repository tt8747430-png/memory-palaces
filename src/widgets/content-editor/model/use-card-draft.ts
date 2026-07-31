import { useEffect, useState } from 'react'

export interface CardDraftSource {
  front: string
  back: string
  hint?: string
  tip?: string
}

/**
 * A card's four fields as a command carries them. Optionals are `undefined` rather than absent, so
 * clearing a hint reaches `updateCard` as a real change, not as "leave it alone".
 */
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
  /** The draft differs from what is stored — nothing to save when false. */
  dirty: boolean
  /** The trimmed edit. */
  changes: CardDraftEdit
  /** Empties every field, for the save-and-add-another pass. */
  clear: () => void
}

const blank: CardDraftSource = { front: '', back: '' }

/**
 * Editable copies of a card's four fields, and the one place the app decides what a card edit
 * means: what is valid, what counts as changed, how a cleared optional reaches a command. Re-seeds
 * from `source` whenever `seed` changes, so a sheet opening on a different card — or the same one
 * reopened — starts from what is stored, not what was last typed.
 */
export function useCardDraft(source: CardDraftSource | null, seed: string | null): CardDraft {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')

  useEffect(() => {
    const next = source ?? blank
    setFront(next.front)
    setBack(next.back)
    setHint(next.hint ?? '')
    setTip(next.tip ?? '')
    // Keyed on `seed` alone: `source` changing under the same seed is the user's own edit coming
    // back around, and must not overwrite it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const changes: CardDraftEdit = {
    front: front.trim(),
    back: back.trim(),
    hint: hint.trim() || undefined,
    tip: tip.trim() || undefined,
  }

  const stored = source ?? blank
  const dirty =
    changes.front !== stored.front ||
    changes.back !== stored.back ||
    changes.hint !== (stored.hint || undefined) ||
    changes.tip !== (stored.tip || undefined)

  return {
    front,
    back,
    hint,
    tip,
    setFront,
    setBack,
    setHint,
    setTip,
    valid: changes.front.length > 0 && changes.back.length > 0,
    dirty,
    changes,
    clear: () => {
      setFront('')
      setBack('')
      setHint('')
      setTip('')
    },
  }
}
