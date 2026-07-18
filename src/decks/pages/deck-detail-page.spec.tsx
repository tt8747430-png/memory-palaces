import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeCard } from '@/decks/model/card'
import { makeDeck } from '@/decks/model/deck'
import { OverlayHost } from '@/shared/ui'
import { DeckDetailPage } from './deck-detail-page'

const noop = () => {}

function renderPage(services: Services, deckId = 'd1') {
  return render(
    <MemoryRouter>
      <ServicesProvider services={services}>
        <DeckDetailPage
          deckId={deckId}
          onBack={noop}
          onOpenSettings={noop}
          onAddCard={noop}
          onEditCard={noop}
          onPasteNotes={noop}
          onReviewImport={noop}
        />
        <OverlayHost />
      </ServicesProvider>
    </MemoryRouter>,
  )
}

/** A started deck+card store holding one deck with one card. */
async function seed() {
  const services = createTestServices()
  services.deckStore.start()
  services.cardStore.start()
  services.questionStore.start()
  await services.deckStore.save(
    makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
  )
  await services.cardStore.save(
    makeCard({
      id: 'c1',
      deckId: 'd1',
      createdAt: '2026-07-16T00:00:00.000Z',
      front: 'France',
      back: 'Paris',
    }),
  )
  return services
}

describe('DeckDetailPage', () => {
  it('shows a placeholder while the stores are still loading', () => {
    // Stores deliberately unstarted: status stays 'idle', which is the pre-ready state.
    const { container } = renderPage(createTestServices())

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows the not-found header when the deck id matches nothing', async () => {
    const services = await seed()

    renderPage(services, 'missing')

    expect(await screen.findByText('Deck not found')).toBeInTheDocument()
  })

  it('renders the deck name and its cards once ready', async () => {
    renderPage(await seed())

    expect(await screen.findByText('Capitals')).toBeInTheDocument()
    expect(await screen.findByText('France')).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = renderPage(await seed())
    await screen.findByText('Capitals')

    await expectNoA11yViolations(container)
  })
})
