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
  valid: boolean
  dirty: boolean
  changes: CardDraftEdit
  clear: () => void
}

const blank: CardDraftSource = { front: '', back: '' }

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
