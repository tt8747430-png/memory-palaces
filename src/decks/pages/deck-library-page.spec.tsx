import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { createTestServices } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeck } from '@/decks/model/deck'
import { OverlayHost } from '@/shared/ui'
import { DeckLibraryPage } from './deck-library-page'

describe('DeckLibraryPage', () => {
  it('renders decks from the store', async () => {
    const services = createTestServices()
    services.deckStore.start()
    services.folderStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    render(
      <MemoryRouter>
        <ServicesProvider services={services}>
          <DeckLibraryPage onOpenDeck={() => {}} />
        </ServicesProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Capitals')).toBeInTheDocument()
  })

  it('shows the empty state when there are no decks', async () => {
    const services = createTestServices()
    services.deckStore.start()
    services.folderStore.start()

    render(
      <MemoryRouter>
        <ServicesProvider services={services}>
          <DeckLibraryPage onOpenDeck={() => {}} />
        </ServicesProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/build your first deck/i)).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const services = createTestServices()
    services.deckStore.start()
    services.folderStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    const { container } = render(
      <MemoryRouter>
        <ServicesProvider services={services}>
          <DeckLibraryPage onOpenDeck={() => {}} />
          <OverlayHost />
        </ServicesProvider>
      </MemoryRouter>,
    )
    await screen.findByText('Capitals')

    await expectNoA11yViolations(container)
  })
})
