import { useEffect, useMemo, useRef, useState } from 'react'
import { isReferenceMarker, normalizeInitial, tokenizeWords, wordInitial } from '@/shared/lib'

const WRONG_LETTER_MS = 650

export interface InitialsRecall {
  tokens: string[]
  accepted: number
  typedCount: number
  complete: boolean
  wrong: { char: string; seq: number } | null
  nextWord: () => void
  handleInput: (raw: string) => void
  reset: () => void
}

/** A token that carries no letter cue — a verse number, punctuation — fills itself in. */
function isAutoToken(token: string): boolean {
  return isReferenceMarker(token) || wordInitial(token).initial === ''
}

export function useInitialsRecall(
  answer: string,
  enabled: boolean,
  onSolved: () => void,
): InitialsRecall {
  const tokens = useMemo(() => tokenizeWords(answer), [answer])

  const advanceAuto = (from: number): number => {
    let index = from
    while (index < tokens.length && isAutoToken(tokens[index]!)) index += 1
    return index
  }

  const [accepted, setAccepted] = useState(() => advanceAuto(0))
  const [wrong, setWrong] = useState<{ char: string; seq: number } | null>(null)
  const wrongTimer = useRef<number | undefined>(undefined)
  const seq = useRef(0)

  useEffect(() => () => window.clearTimeout(wrongTimer.current), [])

  const typedCount = tokens.slice(0, accepted).filter((token) => !isAutoToken(token)).length
  const complete = tokens.length > 0 && accepted >= tokens.length

  useEffect(() => {
    if (enabled && complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, complete])

  const flashWrong = (char: string) => {
    seq.current += 1
    setWrong({ char, seq: seq.current })
    window.clearTimeout(wrongTimer.current)
    wrongTimer.current = window.setTimeout(() => setWrong(null), WRONG_LETTER_MS)
  }

  const nextWord = () =>
    setAccepted((prev) => (prev < tokens.length ? advanceAuto(prev + 1) : prev))

  const handleInput = (raw: string) => {
    let next = accepted
    let rejected: string | null = null
    for (const char of raw) {
      if (next >= tokens.length) break
      if (!/[\p{L}\p{N}]/u.test(char)) continue
      const cue = wordInitial(tokens[next]!).initial
      if (cue && normalizeInitial(char) === normalizeInitial(cue.charAt(0))) {
        next = advanceAuto(next + 1)
      } else {
        rejected = char
      }
    }
    if (next !== accepted) setAccepted(next)
    if (rejected) flashWrong(rejected)
  }

  const reset = () => setAccepted(advanceAuto(0))

  return { tokens, accepted, typedCount, complete, wrong, nextWord, handleInput, reset }
}
