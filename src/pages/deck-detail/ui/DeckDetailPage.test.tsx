import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, CardStoreContext, createCardStore, makeCard } from '@/entities/card'
import {
  createDeckStore,
  type Deck,
  type DeckSettings,
  DeckStoreContext,
  makeDeck,
} from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { DeckDetailPage } from './DeckDetailPage'

afterEach(cleanup)

const card = (id: string, over: Partial<Card> = {}): Card => ({
  ...makeCard({
    id,
    createdAt: new Date(0).toISOString(),
    deckId: 'd1',
    front: `Front ${id}`,
    back: `Back ${id}`,
  }),
  ...over,
})

function renderPage(settings: Partial<DeckSettings> = {}, cards: Card[] = [card('c1')]) {
  const deck = makeDeck({
    id: 'd1',
    createdAt: new Date(0).toISOString(),
    name: 'Physics',
    settings,
  })
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesStoreContext
        value={started(createPreferencesStore(new InMemoryRepository<Preferences>()))}
      >
        <QuestionStoreContext
          value={started(createQuestionStore(new InMemoryRepository<Question>()))}
        >
          <FolderStoreContext value={started(createFolderStore(new InMemoryRepository<Folder>()))}>
            <CardStoreContext value={started(createCardStore(new InMemoryRepository<Card>(cards)))}>
              <DeckStoreContext
                value={started(createDeckStore(new InMemoryRepository<Deck>([deck])))}
              >
                <DeckDetailPage
                  deckId="d1"
                  onAddCard={() => {}}
                  onEditCard={() => {}}
                  onPasteNotes={() => {}}
                  onReviewImport={() => {}}
                />
              </DeckStoreContext>
            </CardStoreContext>
          </FolderStoreContext>
        </QuestionStoreContext>
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
}

describe('DeckDetailPage', () => {
  it('shows the fast-review buckets and no maturity bar', async () => {
    renderPage({ algorithm: 'fast' })
    expect(await screen.findByText('Not studied')).toBeInTheDocument()
    expect(screen.getByText('Not quite')).toBeInTheDocument()
    expect(screen.getByText('Got it')).toBeInTheDocument()
    expect(screen.getByText(/cards? to study/)).toBeInTheDocument()
    expect(screen.queryByText(/Cards in this deck/)).toBeNull()
  })

  it('shows the SRS breakdown and the maturity bar under spaced repetition', async () => {
    renderPage({ algorithm: 'spaced' })
    expect(await screen.findByText(/cards? for today/)).toBeInTheDocument()
    expect(screen.getAllByText('New').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Learning').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mastered').length).toBeGreaterThan(0)
    expect(screen.getByText(/Cards in this deck/)).toBeInTheDocument()
  })

  it('names the deck algorithm under the title', async () => {
    renderPage({ algorithm: 'fast' })
    expect(await screen.findByText('Learning algorithm:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fast review' })).toBeInTheDocument()
  })

  it('filters the cards from the header search, and offers a way out of a dead end', async () => {
    const user = userEvent.setup()
    renderPage({ algorithm: 'fast' }, [
      card('c1', { front: 'Momentum', back: 'mass times velocity' }),
      card('c2', { front: 'Entropy', back: 'disorder' }),
    ])

    await user.click(await screen.findByRole('button', { name: /search cards/i }))
    await user.type(screen.getByRole('searchbox', { name: /search cards/i }), 'entro')

    expect(screen.getByText('Entropy')).toBeInTheDocument()
    expect(screen.queryByText('Momentum')).toBeNull()

    // A search that matches nothing has to offer its own exit — `NoResults` was unreachable
    // before the screen passed `searchQuery` at all.
    await user.clear(screen.getByRole('searchbox', { name: /search cards/i }))
    await user.type(screen.getByRole('searchbox', { name: /search cards/i }), 'zzzz')
    expect(screen.getByText(/no matches/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear search/i }))
    expect(screen.getByText('Momentum')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })
})
