import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { type Card, CardStoreContext, createCardStore, makeCard } from '@/entities/card'
import { MatchPage } from './MatchPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderMatch(deckId = 'd1') {
  const deckRepo = new InMemoryRepository<Deck>([
    makeDeck({ id: 'd1', createdAt: at(0), name: 'Forum' }),
  ])
  const cardRepo = new InMemoryRepository<Card>([
    makeCard({ id: 'c1', createdAt: at(1), deckId: 'd1', front: 'Alpha', back: 'first letter' }),
    makeCard({ id: 'c2', createdAt: at(2), deckId: 'd1', front: 'Beta', back: 'second letter' }),
  ])
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <DeckStoreContext value={createDeckStore(deckRepo)}>
          <CardStoreContext value={createCardStore(cardRepo)}>
            <MatchPage scope={{ kind: 'deck', deckId }} onBack={() => {}} />
          </CardStoreContext>
        </DeckStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('MatchPage', () => {
  it('builds the board from the deck subtree cards', async () => {
    renderMatch()
    expect(await screen.findByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'first letter' })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown deck', async () => {
    renderMatch('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })
})
