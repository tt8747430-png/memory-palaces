import { describe, expect, it } from 'vitest'
import { storedDeck } from './deck-fixtures'
import { followedMainSettings, mainDeckOf, resolveDeckSettings } from './settings'
import { DEFAULT_DECK_SETTINGS } from './types'

describe('resolveDeckSettings', () => {
  /**
   * Replication can hand this device a deck carrying a preset the migration already retired, so the
   * read seam has to answer an unknown *value* the way it answers an absent key. Without this, the
   * style page would hand that id straight back to `validateDeckSettings` on Apply.
   */
  it('snaps a card style the app no longer has back to the default', () => {
    const decks = [
      storedDeck('d1', {
        settings: {
          cardStyle: { preset: 'outlined', font: 'serif', textSize: 22, alignment: 'left' },
        },
      } as never),
    ]
    expect(resolveDeckSettings(decks, 'd1').cardStyle).toEqual({
      preset: 'plain',
      font: 'serif',
      textSize: 22,
      alignment: 'left',
    })
  })

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
