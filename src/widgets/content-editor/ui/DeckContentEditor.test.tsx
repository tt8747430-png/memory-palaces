import { afterEach, describe, expect, it, vi } from 'vitest'
import { started } from '@/shared/test/started'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
import { DeckContentEditor } from './DeckContentEditor'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function Editor({ onAddCard }: { onAddCard: () => void }) {
  const selection = useMultiSelect()
  return (
    <DeckContentEditor
      deckId="d1"
      selection={selection}
      sort="manual"
      onSortChange={() => {}}
      onAddCard={onAddCard}
      onEditCard={() => {}}
      onPasteNotes={() => {}}
      onReviewImport={() => {}}
    />
  )
}

function renderEditor({
  cards = [] as Card[],
  questions = [] as Question[],
  onAddCard = vi.fn(),
}: { cards?: Card[]; questions?: Question[]; onAddCard?: () => void } = {}) {
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
                  <Editor onAddCard={onAddCard} />
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
    await user.click(screen.getByRole('button', { name: /add card/i }))

    expect(onAddCard).toHaveBeenCalledOnce()
  })

  it('shows the cards empty state for a fresh deck', async () => {
    renderEditor()
    expect(await screen.findByRole('heading', { name: /no cards yet/i })).toBeInTheDocument()
  })
})
