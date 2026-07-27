import { useMemo, useState } from 'react'
import {
  detectPasteFormat,
  guessFieldSeparator,
  type ParsedCard,
  parseDelimitedNotes,
  parseVerses,
  type PasteFormat,
} from '@/shared/lib'

export type FieldSep = 'auto' | 'tab' | 'comma' | 'custom'
export type CardSep = 'newline' | 'semicolon' | 'custom'

const FIELD_VALUE: Record<'tab' | 'comma', string> = { tab: '\t', comma: ',' }
const CARD_VALUE: Record<Exclude<CardSep, 'custom'>, string> = { newline: '\n', semicolon: ';' }
const SEP_GLYPH: Record<string, string> = { '\t': '⇥', ',': ',', ';': ';', '|': '|', ' ': '␣' }

/** Separators are invisible characters; show the learner a glyph they can actually read. */
export const displaySep = (value: string) => SEP_GLYPH[value] ?? value

export interface PasteParsing {
  text: string
  setText: (value: string) => void
  /** What the text looks like — detected, unless the learner has overridden it. */
  format: PasteFormat
  /** True while the format is whatever detection said, so the UI can say "auto". */
  auto: boolean
  setFormat: (format: PasteFormat) => void
  resetFormat: () => void
  guessedField: string
  fieldSep: FieldSep
  setFieldSep: (value: FieldSep) => void
  customField: string
  setCustomField: (value: string) => void
  cardSep: CardSep
  setCardSep: (value: CardSep) => void
  customCard: string
  setCustomCard: (value: string) => void
  swap: boolean
  setSwap: (value: boolean) => void
  skipHeader: boolean
  setSkipHeader: (value: boolean) => void
  cards: ParsedCard[]
}

/**
 * Turning pasted text into cards: what the text is, how it is split, and the cards that fall
 * out of those choices. Everything re-parses from the raw text, so no setting is ever stale.
 */
export function usePasteParsing(): PasteParsing {
  const [text, setText] = useState('')
  const [override, setOverride] = useState<PasteFormat | null>(null)
  const [fieldSep, setFieldSep] = useState<FieldSep>('auto')
  const [cardSep, setCardSep] = useState<CardSep>('newline')
  const [customField, setCustomField] = useState('')
  const [customCard, setCustomCard] = useState('')
  const [swap, setSwap] = useState(false)
  const [skipHeader, setSkipHeader] = useState(false)

  const detected = useMemo(() => detectPasteFormat(text), [text])
  const format = override ?? detected
  const guessedField = useMemo(() => guessFieldSeparator(text), [text])
  const field =
    fieldSep === 'auto' ? guessedField : fieldSep === 'custom' ? customField : FIELD_VALUE[fieldSep]
  const card = cardSep === 'custom' ? customCard || '\n' : CARD_VALUE[cardSep]

  const cards = useMemo(() => {
    if (!text.trim()) return []
    if (format === 'bible') return parseVerses(text)
    if (!field) return []
    return parseDelimitedNotes(text, { field, card, swap, skipHeader })
  }, [text, format, field, card, swap, skipHeader])

  return {
    text,
    setText,
    format,
    auto: override === null,
    setFormat: setOverride,
    resetFormat: () => setOverride(null),
    guessedField,
    fieldSep,
    setFieldSep,
    customField,
    setCustomField,
    cardSep,
    setCardSep,
    customCard,
    setCustomCard,
    swap,
    setSwap,
    skipHeader,
    setSkipHeader,
    cards,
  }
}
