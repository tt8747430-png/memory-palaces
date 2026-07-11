import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { CardStoreContext, createCardStore, type Card, makeCard } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { DeckContentEditor } from './DeckContentEditor'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

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
          value={createPreferencesStore(new InMemoryRepository<Preferences>())}
        >
          <DeckStoreContext value={createDeckStore(new InMemoryRepository<Deck>(decks))}>
            <CardStoreContext value={createCardStore(new InMemoryRepository<Card>(cards))}>
              <QuestionStoreContext
                value={createQuestionStore(new InMemoryRepository<Question>(questions))}
              >
                <DeckContentEditor
                  deckId="d1"
                  deckName="Garden"
                  selectMode={false}
                  onSelectModeChange={() => {}}
                  sort="manual"
                  onSortChange={() => {}}
                  onAddCard={onAddCard}
                  onEditCard={() => {}}
                  onPasteNotes={() => {}}
                  onReviewImport={() => {}}
                />
              </QuestionStoreContext>
            </CardStoreContext>
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
    expect(screen.getByRole('button', { name: /add to room/i })).toBeInTheDocument()
  })

  it('opens the card editor from the dial', async () => {
    const user = userEvent.setup()
    const onAddCard = vi.fn()
    renderEditor({
      cards: [makeCard({ id: 'c1', createdAt: at(1), deckId: 'd1', front: 'seed', back: 'root' })],
      onAddCard,
    })
    await screen.findByText('seed')

    await user.click(screen.getByRole('button', { name: /add to room/i }))
    await user.click(screen.getByRole('button', { name: /add card/i }))

    expect(onAddCard).toHaveBeenCalledOnce()
  })

  it('shows the cards empty state for a fresh deck', async () => {
    renderEditor()
    expect(await screen.findByRole('heading', { name: /no cards yet/i })).toBeInTheDocument()
  })
})
