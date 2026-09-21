import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, CardStoreContext, createCardStore, makeCard } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import {
  createHistoryStore,
  type HistoryEntry,
  HistoryStoreContext,
} from '@/entities/learning-history'
import { StudyCardsPage } from './StudyCardsPage'

afterEach(cleanup)

const AT = new Date(0).toISOString()

/** Ordered by `order` in the store, but alphabetically the other way about. */
const CARDS: Card[] = [
  makeCard({ id: 'c1', createdAt: AT, deckId: 'd1', front: 'Zebra', back: 'z', order: 0 }),
  makeCard({ id: 'c2', createdAt: AT, deckId: 'd1', front: 'Mango', back: 'm', order: 1 }),
  makeCard({ id: 'c3', createdAt: AT, deckId: 'd1', front: 'Apple', back: 'a', order: 2 }),
]

function renderStudy(contentSort: Preferences['contentSort'], startCardId?: string) {
  const preferences = makePreferences({ id: 'preferences', createdAt: AT, contentSort })
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesStoreContext
        value={started(createPreferencesStore(new InMemoryRepository<Preferences>([preferences])))}
      >
        <CardStoreContext value={started(createCardStore(new InMemoryRepository<Card>(CARDS)))}>
          <DeckStoreContext
            value={started(
              createDeckStore(
                new InMemoryRepository<Deck>([
                  makeDeck({ id: 'd1', createdAt: AT, name: 'Fruit' }),
                ]),
              ),
            )}
          >
            <HistoryStoreContext
              value={started(createHistoryStore(new InMemoryRepository<HistoryEntry>()))}
            >
              <StudyCardsPage scope={{ kind: 'deck', deckId: 'd1' }} startCardId={startCardId} />
            </HistoryStoreContext>
          </DeckStoreContext>
        </CardStoreContext>
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
}

async function grade() {
  fireEvent.click(await screen.findByRole('button', { name: /show answer/i }))
  fireEvent.click(await screen.findByRole('button', { name: /good/i }))
}

describe('StudyCardsPage — a run follows the order the learner is looking at', () => {
  it('opens on the card that was picked out', async () => {
    renderStudy('manual', 'c2')
    expect(await screen.findByRole('heading', { name: 'Mango' })).toBeInTheDocument()
  })

  it('runs on in the deck’s own order when that is how the list is sorted', async () => {
    renderStudy('manual', 'c2')
    await grade()
    expect(await screen.findByRole('heading', { name: 'Apple' })).toBeInTheDocument()
  })

  it('runs on in the learner’s sort — the card after the one they picked, as they see it', async () => {
    // Sorted by name the list reads Apple, Mango, Zebra: after Mango comes Zebra, not Apple.
    renderStudy('name', 'c2')
    expect(await screen.findByRole('heading', { name: 'Mango' })).toBeInTheDocument()
    await grade()
    expect(await screen.findByRole('heading', { name: 'Zebra' })).toBeInTheDocument()
  })
})
