import { useMemo, useState } from 'react'
import { guessFieldSeparator, type ParsedCard, parseDelimitedNotes } from '@/shared/lib'

export type FieldSep = 'auto' | 'tab' | 'comma' | 'custom'
export type CardSep = 'newline' | 'semicolon' | 'custom'

const FIELD_VALUE: Record<'tab' | 'comma', string> = { tab: '\t', comma: ',' }
const CARD_VALUE: Record<Exclude<CardSep, 'custom'>, string> = { newline: '\n', semicolon: ';' }
const SEP_GLYPH: Record<string, string> = { '\t': '⇥', ',': ',', ';': ';', '|': '|', ' ': '␣' }

export const displaySep = (value: string) => SEP_GLYPH[value] ?? value

export interface PasteParsing {
  text: string
  setText: (value: string) => void
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

/** Notes only. Anything with a format of its own belongs to the extension that owns that format. */
export function usePasteParsing(): PasteParsing {
  const [text, setText] = useState('')
  const [fieldSep, setFieldSep] = useState<FieldSep>('auto')
  const [cardSep, setCardSep] = useState<CardSep>('newline')
  const [customField, setCustomField] = useState('')
  const [customCard, setCustomCard] = useState('')
  const [swap, setSwap] = useState(false)
  const [skipHeader, setSkipHeader] = useState(false)

  const guessedField = useMemo(() => guessFieldSeparator(text), [text])
  const field =
    fieldSep === 'auto' ? guessedField : fieldSep === 'custom' ? customField : FIELD_VALUE[fieldSep]
  const card = cardSep === 'custom' ? customCard || '\n' : CARD_VALUE[cardSep]

  const cards = useMemo(() => {
    if (!text.trim()) return []
    if (!field) return []
    return parseDelimitedNotes(text, { field, card, swap, skipHeader })
  }, [text, field, card, swap, skipHeader])

  return {
    text,
    setText,
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
