import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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

  it('keeps the card nav pinned beside content too long to fit', async () => {
    renderPage([card('c1', 'Front', LONG), card('c2', 'Second')], {
      cardId: 'c1',
      onNavigateCard: vi.fn(),
    })

    const nav = await screen.findByRole('navigation')
    const dock = nav.parentElement
    const main = screen.getByRole('main')
    // Beside the scroll body, not the last thing inside it: the body scrolls under a box that
    // cannot move, rather than sticking to an edge it eventually reaches.
    expect(main).not.toContainElement(dock)
    expect(dock?.parentElement).toBe(main.parentElement)
    expect(dock).toHaveClass('shrink-0')

    const back = screen.getByLabelText(/^Back \(/) as HTMLTextAreaElement
    expect(back.value).toBe(LONG)
    expect(back).toHaveClass('resize-none')
  })

  it('gives the scroll body the keyboard range under the dock', async () => {
    renderPage([card('c1', 'Front'), card('c2', 'Second')], {
      cardId: 'c1',
      onNavigateCard: vi.fn(),
    })
    expect(await screen.findByRole('main')).toHaveClass('pb-keyboard')
  })

  it('keeps its footer for a deck of one, with nowhere to go either way', async () => {
    // The route decides the footer, not the card count: one that came and went with the data
    // re-laid the scroll body out on the first paint of real content.
    renderPage([card('c1', 'Front')], { cardId: 'c1', onNavigateCard: vi.fn() })
    await screen.findByLabelText(/Front/)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveTextContent('1 / 1')
    for (const button of within(nav).getAllByRole('button')) expect(button).toBeDisabled()
  })
})
