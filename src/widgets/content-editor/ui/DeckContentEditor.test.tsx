import { afterEach, describe, expect, it, vi } from 'vitest'
import { started } from '@/shared/test/started'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { useMultiSelect } from '@/shared/lib'
import { InMemoryRepository } from '@/shared/api'
import { type Card, CardStoreContext, createCardStore, makeCard } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import {
  createHistoryStore,
  type HistoryEntry,
  HistoryStoreContext,
  makeHistoryEntry,
} from '@/entities/learning-history'
import { AppScreen } from '@/shared/ui'
import { useCardList } from '../model/use-card-list'
import { DeckContentEditor } from './DeckContentEditor'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function Editor({ onAddCard }: { onAddCard: () => void }) {
  const list = useCardList({ deckId: 'd1', algorithm: 'spaced', sort: 'manual' })
  const selection = useMultiSelect({ visibleIds: list.visibleIds })
  return (
    <AppScreen>
      <DeckContentEditor
        list={list}
        selection={selection}
        onSortChange={() => {}}
        onAddCard={onAddCard}
        onEditCard={() => {}}
        onPasteNotes={() => {}}
        onReviewImport={() => {}}
      />
    </AppScreen>
  )
}

function renderEditor({
  cards = [] as Card[],
  questions = [] as Question[],
  history = [] as HistoryEntry[],
  onAddCard = vi.fn(),
}: {
  cards?: Card[]
  questions?: Question[]
  history?: HistoryEntry[]
  onAddCard?: () => void
} = {}) {
  const decks = [makeDeck({ id: 'd1', createdAt: at(0), name: 'Garden' })]
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PreferencesStoreContext
          value={started(createPreferencesStore(new InMemoryRepository<Preferences>()))}
        >
          <DeckStoreContext value={started(createDeckStore(new InMemoryRepository<Deck>(decks)))}>
            <FolderStoreContext
              value={started(createFolderStore(new InMemoryRepository<Folder>()))}
            >
              <CardStoreContext
                value={started(createCardStore(new InMemoryRepository<Card>(cards)))}
              >
                <QuestionStoreContext
                  value={started(createQuestionStore(new InMemoryRepository<Question>(questions)))}
                >
                  <HistoryStoreContext
                    value={started(
                      createHistoryStore(new InMemoryRepository<HistoryEntry>(history)),
                    )}
                  >
                    <Editor onAddCard={onAddCard} />
                  </HistoryStoreContext>
                </QuestionStoreContext>
              </CardStoreContext>
            </FolderStoreContext>
          </DeckStoreContext>
        </PreferencesStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('DeckContentEditor', () => {
  it('lists a deck’s cards and offers the add dial', async () => {
    renderEditor({
      cards: [makeCard({ id: 'c1', createdAt: at(1), deckId: 'd1', front: 'mihi', back: 'to me' })],
    })

    expect(await screen.findByText('mihi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to deck/i })).toBeInTheDocument()
  })

  it('opens the card editor from the dial', async () => {
    const user = userEvent.setup()
    const onAddCard = vi.fn()
    renderEditor({
      cards: [makeCard({ id: 'c1', createdAt: at(1), deckId: 'd1', front: 'seed', back: 'root' })],
      onAddCard,
    })
    await screen.findByText('seed')

    await user.click(screen.getByRole('button', { name: /add to deck/i }))
    await user.click(await screen.findByRole('menuitem', { name: /add card/i }))

    expect(onAddCard).toHaveBeenCalledOnce()
  })

  it('shows the cards empty state for a fresh deck', async () => {
    renderEditor()
    expect(await screen.findByRole('heading', { name: /no cards yet/i })).toBeInTheDocument()
  })

  /**
   * Every surface that offers the card catalog must actually reach its far end
   * — Learning history is the second-to-last entry, the first one a menu that
   * cannot scroll drops.
   */
  describe('the card catalog reaches Learning history', () => {
    const openRowMenu = async (user: UserEvent) => {
      await user.click(await screen.findByRole('button', { name: 'Card actions' }))
      return screen.findByRole('button', { name: 'Learning history' })
    }

    const openBrowserMenu = async (user: UserEvent) => {
      await user.click(await screen.findByText('seed'))
      const browser = await screen.findByRole('dialog')
      await user.click(within(browser).getByRole('button', { name: 'Card actions' }))
      return screen.findByRole('menuitem', { name: 'Learning history' })
    }

    it.each([
      ['the row menu', openRowMenu],
      ['the card browser menu', openBrowserMenu],
    ])('opens the learning history sheet from %s', async (_name, open) => {
      const user = userEvent.setup()
      // Learning history is only offered for a card that has some — so the card has one.
      renderEditor({
        cards: [
          makeCard({ id: 'c1', createdAt: at(1), deckId: 'd1', front: 'seed', back: 'root' }),
        ],
        history: [
          makeHistoryEntry({
            id: 'h1',
            createdAt: at(2),
            cardId: 'c1',
            deckId: 'd1',
            kind: 'graded',
            grade: 'good',
          }),
        ],
      })
      await screen.findByText('seed')

      await user.click(await open(user))

      expect(await screen.findByRole('heading', { name: 'Learning history' })).toBeInTheDocument()
    })

    it('is not offered at all for a card nothing has been recorded against', async () => {
      const user = userEvent.setup()
      renderEditor({
        cards: [
          makeCard({ id: 'c1', createdAt: at(1), deckId: 'd1', front: 'seed', back: 'root' }),
        ],
      })
      await screen.findByText('seed')

      await user.click(await screen.findByRole('button', { name: 'Card actions' }))
      await screen.findByRole('button', { name: 'Edit' })
      expect(screen.queryByRole('button', { name: 'Learning history' })).toBeNull()
    })
  })
})
