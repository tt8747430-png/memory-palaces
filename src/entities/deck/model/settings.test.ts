import { describe, expect, it } from 'vitest'
import { storedDeck } from './deck-fixtures'
import { followedMainSettings, mainDeckOf, resolveDeckSettings } from './settings'
import { DEFAULT_DECK_SETTINGS } from './types'

describe('resolveDeckSettings', () => {
  it('reads the algorithm screen from the main deck, whatever a subdeck stored', () => {
    const decks = [
      storedDeck('main', { settings: { algorithm: 'fast', newCardsPerDay: 4 } }),
      storedDeck('sub', {
        parentId: 'main',
        settings: { algorithm: 'spaced', shuffleCards: true },
      }),
    ]

    const settings = resolveDeckSettings(decks, 'sub')

    expect(settings.algorithm).toBe('fast')
    expect(settings.newCardsPerDay).toBe(4)
    expect(settings.shuffleCards).toBe(DEFAULT_DECK_SETTINGS.shuffleCards)
  })

  it('still lets a subdeck override a setting of its own', () => {
    const decks = [
      storedDeck('main', { settings: { textToSpeech: true } }),
      storedDeck('sub', { parentId: 'main', settings: { studyDirection: 'back' } }),
    ]

    expect(resolveDeckSettings(decks, 'sub')).toMatchObject({
      textToSpeech: true,
      studyDirection: 'back',
    })
  })
})

describe('mainDeckOf', () => {
  it('walks to the top of the tree, and is the deck itself at the top', () => {
    const decks = [
      storedDeck('main'),
      storedDeck('sub', { parentId: 'main' }),
      storedDeck('leaf', { parentId: 'sub' }),
    ]

    expect(mainDeckOf(decks, 'leaf')?.id).toBe('main')
    expect(mainDeckOf(decks, 'main')?.id).toBe('main')
    expect(mainDeckOf(decks, 'gone')).toBeUndefined()
  })
})

describe('followedMainSettings', () => {
  it('is the main deck’s own overrides of the algorithm screen, and nothing else', () => {
    const decks = [
      storedDeck('main', {
        settings: { algorithm: 'fast', maxCardsPerDay: 9, textToSpeech: true },
      }),
      storedDeck('sub', { parentId: 'main', settings: { algorithm: 'spaced' } }),
    ]

    expect(followedMainSettings(decks, 'sub')).toEqual({ algorithm: 'fast', maxCardsPerDay: 9 })
  })
})
