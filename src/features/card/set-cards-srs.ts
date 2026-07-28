import { type CardStore, selectCards, updateCard } from '@/entities/card'
import { type DeckStore, selectDecks } from '@/entities/deck'
import { cardsInSubtree, markKnown, type SrsState } from '@/shared/lib'

/** What a card's schedule becomes, given the schedule it has now. */
type SrsPatch = (srs: SrsState | undefined, now: number) => SrsState | undefined

async function patchCardsSrs(
  store: CardStore,
  ids: ReadonlyArray<string>,
  patch: SrsPatch,
): Promise<void> {
  const now = Date.now()
  const updatedAt = new Date(now).toISOString()
  const targets = new Set(ids)
  const cards = store.getState().cards.filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) =>
      store.getState().save(updateCard(card, { srs: patch(card.srs, now) }, updatedAt)),
    ),
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

export async function markCardsKnown(store: CardStore, ids: ReadonlyArray<string>): Promise<void> {
  await patchCardsSrs(store, ids, (srs, now) => markKnown(srs, now))
}

export async function resetCardsSrs(store: CardStore, ids: ReadonlyArray<string>): Promise<void> {
  await patchCardsSrs(store, ids, () => undefined)
}

export async function markDeckKnown(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  await markCardsKnown(cardStore, subtreeCardIds(deckStore, cardStore, deckId))
}

export async function resetDeckSrs(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
): Promise<void> {
  await resetCardsSrs(cardStore, subtreeCardIds(deckStore, cardStore, deckId))
}
