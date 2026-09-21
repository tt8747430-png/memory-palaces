import { type CardStyle, type Deck, type DeckStore, selectDecks } from '@/entities/deck'
import { sameCardStyle, subtreeDeckIds } from '@/shared/lib'
import { updateDeckSettings } from './update-deck-settings'

/** How far a card style reaches when it is applied. */
export type CardStyleScope =
  | { kind: 'deck'; deckId: string }
  | { kind: 'subtree'; deckId: string }
  | { kind: 'all' }
  | { kind: 'ids'; ids: readonly string[] }

/** The decks a scope names, in the library as it stands. Pure, so a screen can count them first. */
export function cardStyleTargets(decks: readonly Deck[], scope: CardStyleScope): string[] {
  switch (scope.kind) {
    case 'deck':
      return [scope.deckId]
    case 'subtree':
      return subtreeDeckIds(decks, scope.deckId)
    case 'all':
      return decks.filter((deck) => !deck.archived).map((deck) => deck.id)
    case 'ids':
      return [...new Set(scope.ids)]
  }
}

/**
 * Gives a card style to every deck in the scope, by **copying** it: each deck ends up owning the
 * style outright, and its own control goes on working. Nothing is left inheriting, so changing one
 * deck later cannot quietly change the others.
 *
 * A deck that already stores this exact style is skipped, so applying the same style twice is free
 * and does not fill the pending change log with writes that change nothing. A deck that has never
 * had a style of its own is always written, even where it happened to inherit the same one — that
 * is the difference between owning a style and borrowing it.
 *
 * Returns how many decks actually changed, which is what the learner should be told.
 */
export async function applyCardStyle(
  store: DeckStore,
  style: CardStyle,
  scope: CardStyleScope,
): Promise<number> {
  const decks = selectDecks(store.getState())
  const byId = new Map(decks.map((deck) => [deck.id, deck]))

  const changing = cardStyleTargets(decks, scope).filter((id) => {
    const own = byId.get(id)?.settings.cardStyle
    return byId.has(id) && (own === undefined || !sameCardStyle(own, style))
  })

  await Promise.all(changing.map((id) => updateDeckSettings(store, id, { cardStyle: style })))
  return changing.length
}
