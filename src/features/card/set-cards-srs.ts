import {
  type Card,
  type CardChanges,
  type CardStore,
  selectCards,
  updateCard,
} from '@/entities/card'
import { type DeckStore, selectDecks } from '@/entities/deck'
import { cardsInSubtree, markKnown, nowIso } from '@/shared/lib'

/** What a card's learning state becomes, given the state it has now. */
type ProgressPatch = (card: Card, now: number) => CardChanges

async function patchCardsProgress(
  store: CardStore,
  ids: ReadonlyArray<string>,
  patch: ProgressPatch,
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = nowIso(now)
  const targets = new Set(ids)
  const cards = store.getState().cards.filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) => store.getState().save(updateCard(card, patch(card, now), updatedAt))),
  )
}

/** Every card under `deckId`, subdecks included. */
function subtreeCardIds(deckStore: DeckStore, cardStore: CardStore, deckId: string): string[] {
  return cardsInSubtree(
    selectDecks(deckStore.getState()),
    selectCards(cardStore.getState()),
    deckId,
  ).map((card) => card.id)
}

export async function markCardsKnown(
  store: CardStore,
  ids: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  await patchCardsProgress(store, ids, (card, at) => ({ srs: markKnown(card.srs, at) }), now)
}

/**
 * Reset progress has to mean the same thing under both algorithms, so it drops the fast-review
 * bucket alongside the schedule — otherwise a reset deck still reports cards as "Got it".
 */
export async function resetCardsSrs(
  store: CardStore,
  ids: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  await patchCardsProgress(store, ids, () => ({ srs: undefined, fastReview: undefined }), now)
}

export async function resetDeckSrs(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
  now: number = Date.now(),
): Promise<void> {
  await resetCardsSrs(cardStore, subtreeCardIds(deckStore, cardStore, deckId), now)
}
