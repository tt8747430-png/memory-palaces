import { coerceCardStyle, deckPath, inheritSettings } from '@/shared/lib'
import { type Deck, type DeckSettings, DEFAULT_DECK_SETTINGS, MAIN_DECK_SETTINGS } from './types'

export function resolveDeckSettings(decks: readonly Deck[], deckId: string): DeckSettings {
  const settings = inheritSettings(decks, deckId, DEFAULT_DECK_SETTINGS, MAIN_DECK_SETTINGS)
  return { ...settings, cardStyle: coerceCardStyle(settings.cardStyle) }
}

export function mainDeckOf(decks: readonly Deck[], deckId: string): Deck | undefined {
  return deckPath(decks, deckId)[0]
}

export function followedMainSettings(
  decks: readonly Deck[],
  deckId: string,
): Partial<DeckSettings> {
  const main = mainDeckOf(decks, deckId)
  if (!main) return {}
  return Object.fromEntries(
    MAIN_DECK_SETTINGS.filter((key) => main.settings[key] !== undefined).map((key) => [
      key,
      main.settings[key],
    ]),
  )
}
