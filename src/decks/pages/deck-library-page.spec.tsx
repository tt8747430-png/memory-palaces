import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestServices } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeck } from '@/decks/model/deck'
import { DeckLibraryPage } from './deck-library-page'

describe('DeckLibraryPage', () => {
  it('renders decks from the store', async () => {
    const services = createTestServices()
    services.deckStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    render(
      <ServicesProvider services={services}>
        <DeckLibraryPage />
      </ServicesProvider>,
    )

    expect(await screen.findByText('Capitals')).toBeInTheDocument()
  })

  it('shows the empty state when there are no decks', async () => {
    const services = createTestServices()
    services.deckStore.start()

    render(
      <ServicesProvider services={services}>
        <DeckLibraryPage />
      </ServicesProvider>,
    )

    expect(await screen.findByText(/no decks/i)).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const services = createTestServices()
    services.deckStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    const { container } = render(
      <ServicesProvider services={services}>
        <DeckLibraryPage />
      </ServicesProvider>,
    )
    await screen.findByText('Capitals')

    await expectNoA11yViolations(container)
  })
})
