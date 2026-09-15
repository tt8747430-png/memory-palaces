import {
  type Card,
  type CardChanges,
  type CardStore,
  selectCards,
  updateCard,
} from '@/entities/card'
import { type DeckStore, selectDecks } from '@/entities/deck'
import type { HistoryStore } from '@/entities/learning-history'
import { forgetCardHistory, recordHistoryBatch } from '@/features/history'
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

/**
 * Marks Cards Mastered by hand. It moves the schedule without anyone recalling anything, so it goes
 * on the Learning history too — a Card pushed out to a 180-day interval that then reported "No
 * history yet" was the sheet disagreeing with the schedule it describes.
 */
export async function markCardsKnown(
  store: CardStore,
  history: HistoryStore,
  ids: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  const targets = new Set(ids)
  const cards = store.getState().cards.filter((card) => targets.has(card.id))
  await Promise.all([
    patchCardsProgress(store, ids, (card, at) => ({ srs: markKnown(card.srs, at) }), now),
    recordHistoryBatch(
      history,
      cards.map((card) => {
        const next = markKnown(card.srs, now)
        return {
          cardId: card.id,
          deckId: card.deckId,
          kind: 'mastered' as const,
          intervalBefore: card.srs?.interval,
          intervalAfter: next.interval,
          dueAfter: next.due,
        }
      }),
      now,
    ),
  ])
}

/**
 * Reset progress has to mean the same thing under both algorithms, so it drops the fast-review
 * bucket alongside the schedule — otherwise a reset deck still reports cards as "Got it". The
 * Learning history goes with them: it describes schedules these Cards no longer have.
 */
export async function resetCardsSrs(
  store: CardStore,
  history: HistoryStore,
  ids: ReadonlyArray<string>,
  now: number = Date.now(),
): Promise<void> {
  await Promise.all([
    patchCardsProgress(store, ids, () => ({ srs: undefined, fastReview: undefined }), now),
    forgetCardHistory(history, ids),
  ])
}

export async function resetDeckSrs(
  deckStore: DeckStore,
  cardStore: CardStore,
  history: HistoryStore,
  deckId: string,
  now: number = Date.now(),
): Promise<void> {
  await resetCardsSrs(cardStore, history, subtreeCardIds(deckStore, cardStore, deckId), now)
}
