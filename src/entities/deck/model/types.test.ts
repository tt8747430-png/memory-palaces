import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CARD_STYLE,
  DEFAULT_DECK_SETTINGS,
  type LearningAlgorithm,
  type TtsSide,
  makeDeck,
  updateDeck,
  validateDeckSettings,
} from './types'

const base = { id: 'd1', createdAt: '2026-01-01T00:00:00.000Z', name: 'Bible' }

describe('makeDeck', () => {
  it('creates a top-level deck at the root by default', () => {
    const deck = makeDeck(base)
    expect(deck.parentId).toBeNull()
    expect(deck.folderId).toBeNull()
    expect(deck.order).toBe(0)
    expect(deck.settings).toEqual({})
  })

  it('files a top-level deck in a folder', () => {
    const deck = makeDeck({ ...base, folderId: 'f1' })
    expect(deck.folderId).toBe('f1')
    expect(deck.parentId).toBeNull()
  })

  it('a subdeck belongs to its parent, never a folder', () => {
    const deck = makeDeck({ ...base, parentId: 'p1', folderId: 'f1' })
    expect(deck.parentId).toBe('p1')
    expect(deck.folderId).toBeNull()
  })

  it('stores only setting overrides', () => {
    const deck = makeDeck({ ...base, settings: { textToSpeech: true } })
    expect(deck.settings).toEqual({ textToSpeech: true })
  })

  it('rejects a blank name and negative order', () => {
    expect(() => makeDeck({ ...base, name: '  ' })).toThrow()
    expect(() => makeDeck({ ...base, order: -1 })).toThrow()
  })
})

describe('updateDeck', () => {
  it('re-homing to root clears folderId only when it becomes top-level', () => {
    const sub = makeDeck({ ...base, parentId: 'p1' })
    const moved = updateDeck(sub, { parentId: null, folderId: 'f2' }, '2026-02-01T00:00:00.000Z')
    expect(moved.parentId).toBeNull()
    expect(moved.folderId).toBe('f2')
    expect(moved.updatedAt).toBe('2026-02-01T00:00:00.000Z')
  })

  it('making a deck a subdeck drops any folderId', () => {
    const top = makeDeck({ ...base, folderId: 'f1' })
    const nested = updateDeck(top, { parentId: 'p1' }, '2026-02-01T00:00:00.000Z')
    expect(nested.parentId).toBe('p1')
    expect(nested.folderId).toBeNull()
  })

  it('rejects a blank name', () => {
    const deck = makeDeck(base)
    expect(() => updateDeck(deck, { name: '' }, '2026-02-01T00:00:00.000Z')).toThrow()
  })
})

describe('deck settings', () => {
  it('defaults a deck to spaced repetition', () => {
    expect(DEFAULT_DECK_SETTINGS.algorithm).toBe('spaced')
    expect(DEFAULT_DECK_SETTINGS.newCardsPerDay).toBe(10)
    expect(DEFAULT_DECK_SETTINGS.maxCardsPerDay).toBe(3000)
    expect(DEFAULT_DECK_SETTINGS.cardStyle).toEqual({
      preset: 'plain',
      font: 'default',
      textSize: 30,
      alignment: 'center',
    })
  })

  it('carries settings through makeDeck', () => {
    const deck = makeDeck({
      id: 'd1',
      createdAt: new Date(0).toISOString(),
      name: 'Deck',
      settings: { algorithm: 'fast', newCardsPerDay: 25 },
    })
    expect(deck.settings.algorithm).toBe('fast')
    expect(deck.settings.newCardsPerDay).toBe(25)
  })

  it('rejects a negative daily limit', () => {
    expect(() => validateDeckSettings({ newCardsPerDay: -1 })).toThrow(
      'New cards per day must be >= 0',
    )
    expect(() => validateDeckSettings({ maxCardsPerDay: -1 })).toThrow(
      'Max cards per day must be >= 0',
    )
  })

  it('rejects a text size outside 14–40', () => {
    expect(() =>
      validateDeckSettings({ cardStyle: { ...DEFAULT_CARD_STYLE, textSize: 41 } }),
    ).toThrow('Card text size must be between 14 and 40')
  })

  it('rejects a speech rate outside 0.5–2', () => {
    expect(() => validateDeckSettings({ tts: { side: 'both', rate: 3 } })).toThrow(
      'Speech rate must be between 0.5 and 2',
    )
  })

  it('rejects an unknown speech side', () => {
    expect(() => validateDeckSettings({ tts: { side: 'sideways' as TtsSide, rate: 1 } })).toThrow(
      'Unknown speech side: sideways',
    )
  })

  it('rejects an unknown algorithm', () => {
    expect(() => validateDeckSettings({ algorithm: 'psychic' as LearningAlgorithm })).toThrow(
      'Unknown learning algorithm: psychic',
    )
  })

  it('validates settings when a deck is updated', () => {
    const deck = makeDeck({ id: 'd1', createdAt: new Date(0).toISOString(), name: 'Deck' })
    expect(() =>
      updateDeck(deck, { settings: { maxCardsPerDay: -5 } }, new Date(1).toISOString()),
    ).toThrow('Max cards per day must be >= 0')
  })
})
