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

function subtreeCardIds(deckStore: DeckStore, cardStore: CardStore, deckId: string): string[] {
  return cardsInSubtree(
    selectDecks(deckStore.getState()),
    selectCards(cardStore.getState()),
    deckId,
  ).map((card) => card.id)
}

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
