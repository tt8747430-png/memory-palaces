import { type CardStore, selectCards, updateCard } from '@/entities/card'
import { type DeckStore, selectDecks } from '@/entities/deck'
import { cardsInSubtree, markKnown, nowIso, type SrsState } from '@/shared/lib'

/** What a card's schedule becomes, given the schedule it has now. */
type SrsPatch = (srs: SrsState | undefined, now: number) => SrsState | undefined

async function patchCardsSrs(
  store: CardStore,
  ids: ReadonlyArray<string>,
  patch: SrsPatch,
  now: number = Date.now(),
): Promise<void> {
  const updatedAt = nowIso(now)
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

export async function markCardsKnown(
  store: CardStore,
  ids: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  await patchCardsSrs(store, ids, (srs, at) => markKnown(srs, at), now)
}

export async function resetCardsSrs(
  store: CardStore,
  ids: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  await patchCardsSrs(store, ids, () => undefined, now)
}

export async function resetDeckSrs(
  deckStore: DeckStore,
  cardStore: CardStore,
  deckId: string,
  now: number = Date.now(),
): Promise<void> {
  await resetCardsSrs(cardStore, subtreeCardIds(deckStore, cardStore, deckId), now)
}
