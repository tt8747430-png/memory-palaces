import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, CardStoreContext, createCardStore, makeCard } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { CardEditorPage } from './CardEditorPage'

afterEach(cleanup)

const LONG = 'A sentence long enough to fill the field and then some. '.repeat(20).trim()

function renderPage(cards: Card[], props: { cardId?: string; onNavigateCard?: () => void } = {}) {
  const deck = makeDeck({ id: 'd1', createdAt: new Date(0).toISOString(), name: 'Physics' })
  const repo = new InMemoryRepository<Card>(cards)
  render(
    <I18nextProvider i18n={i18n}>
      <DeckStoreContext value={started(createDeckStore(new InMemoryRepository<Deck>([deck])))}>
        <CardStoreContext value={started(createCardStore(repo))}>
          <CardEditorPage deckId="d1" onBack={() => {}} {...props} />
        </CardStoreContext>
      </DeckStoreContext>
    </I18nextProvider>,
  )
  return { repo }
}

function card(id: string, front: string, back = 'Back') {
  return makeCard({ id, deckId: 'd1', createdAt: new Date(0).toISOString(), front, back })
}

describe('CardEditorPage', () => {
  it('edits the card it was given', async () => {
    const user = userEvent.setup()
    const { repo } = renderPage([card('c1', 'Front')], { cardId: 'c1' })

    const front = await screen.findByLabelText(/Front/)
    await user.clear(front)
    await user.type(front, 'Newton')
    await user.click(screen.getByRole('button', { name: /Save/ }))

    await waitFor(async () => expect((await repo.getById('c1'))?.front).toBe('Newton'))
  })

  /**
   * The other half of the report the study screen's fixed card answered: long text must scroll,
   * never grow the page and carry the bar off the bottom edge. Two things hold it — the fields do
   * not grow (`Textarea` is a fixed `rows` with `resize-none`), and the bar lives in `AppScreen`'s
   * sticky dock rather than at the end of the content, so the port keeps it whatever is above it.
   */
  it('keeps the card nav docked under content too long to fit', async () => {
    renderPage([card('c1', 'Front', LONG), card('c2', 'Second')], {
      cardId: 'c1',
      onNavigateCard: vi.fn(),
    })

    const nav = await screen.findByRole('navigation')
    const dock = nav.parentElement
    expect(dock).toHaveClass('sticky', 'bottom-0')
    expect(dock?.parentElement).toBe(screen.getByRole('main'))
    expect(dock).toBe(screen.getByRole('main').lastElementChild)

    const back = screen.getByLabelText(/^Back \(/) as HTMLTextAreaElement
    expect(back.value).toBe(LONG)
    expect(back).toHaveClass('resize-none')
  })

  /** The dock is the body's own last child, so the keyboard's range is scrolled, never padded. */
  it('gives the scroll body the keyboard range under the dock', async () => {
    renderPage([card('c1', 'Front'), card('c2', 'Second')], {
      cardId: 'c1',
      onNavigateCard: vi.fn(),
    })
    expect(await screen.findByRole('main')).toHaveClass('pb-keyboard')
  })

  it('has no dock to protect when the deck holds a single card', async () => {
    renderPage([card('c1', 'Front')], { cardId: 'c1', onNavigateCard: vi.fn() })
    await screen.findByLabelText(/Front/)
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
