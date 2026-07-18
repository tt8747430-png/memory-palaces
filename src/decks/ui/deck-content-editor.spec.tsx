import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import '@/shared/i18n'
import { createTestServices } from '@/composition-root'
import type { Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { makeCard } from '@/decks/model/card'
import { makeDeck } from '@/decks/model/deck'
import { DeckContentEditor } from './deck-content-editor'

afterEach(cleanup)

const AT = '2026-07-16T00:00:00.000Z'

async function arrange(cards: { id: string; front: string; back: string }[]) {
  const services = createTestServices()
  services.deckStore.start()
  services.cardStore.start()
  services.preferencesStore.start()
  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Garden' }))
  await Promise.all(
    cards.map((card, index) =>
      services.cardStore.save(makeCard({ ...card, createdAt: AT, deckId: 'd1', order: index })),
    ),
  )
  return services
}

function renderEditor(services: Services, onAddCard = vi.fn()) {
  render(
    <MotionConfig reducedMotion="always">
      <ServicesProvider services={services}>
        <DeckContentEditor
          deckId="d1"
          selectMode={false}
          onSelectModeChange={() => {}}
          sort="manual"
          onSortChange={() => {}}
          onAddCard={onAddCard}
          onEditCard={() => {}}
          onPasteNotes={() => {}}
          onReviewImport={() => {}}
        />
      </ServicesProvider>
    </MotionConfig>,
  )
  return onAddCard
}

describe('DeckContentEditor', () => {
  it('lists a deck’s cards and offers the add dial', async () => {
    const services = await arrange([{ id: 'c1', front: 'mihi', back: 'to me' }])
    renderEditor(services)

    expect(await screen.findByText('mihi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to deck/i })).toBeInTheDocument()
  })

  it('opens the card editor from the dial', async () => {
    const user = userEvent.setup()
    const services = await arrange([{ id: 'c1', front: 'seed', back: 'root' }])
    const onAddCard = renderEditor(services)
    await screen.findByText('seed')

    await user.click(screen.getByRole('button', { name: /add to deck/i }))
    await user.click(screen.getByRole('button', { name: /add card/i }))

    expect(onAddCard).toHaveBeenCalledOnce()
  })

  it('shows the cards empty state for a fresh deck', async () => {
    const services = await arrange([])
    renderEditor(services)

    expect(await screen.findByRole('heading', { name: /no cards yet/i })).toBeInTheDocument()
  })
})
