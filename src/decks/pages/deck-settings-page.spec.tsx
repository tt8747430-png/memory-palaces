import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeCard } from '@/decks/model/card'
import { makeDeck } from '@/decks/model/deck'
import { OverlayHost } from '@/shared/ui'
import { DeckSettingsPage } from './deck-settings-page'

const AT = '2026-07-16T00:00:00.000Z'

function renderPage(services: Services, onDeleted = () => {}) {
  return render(
    <MemoryRouter>
      <ServicesProvider services={services}>
        <DeckSettingsPage deckId="d1" onBack={() => {}} onDeleted={onDeleted} />
        <OverlayHost />
      </ServicesProvider>
    </MemoryRouter>,
  )
}

async function seed() {
  const services = createTestServices()
  services.deckStore.start()
  services.cardStore.start()
  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Capitals' }))
  await services.cardStore.save(
    makeCard({ id: 'c1', deckId: 'd1', createdAt: AT, front: 'France', back: 'Paris' }),
  )
  return services
}

describe('DeckSettingsPage', () => {
  it('writes a study toggle straight through editDeck', async () => {
    const services = await seed()
    renderPage(services)

    const shuffle = await screen.findByRole('switch', { name: 'Shuffle cards' })
    expect(shuffle).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(shuffle)

    await waitFor(() => {
      expect(services.deckStore.decks()[0]?.settings?.shuffleCards).toBe(true)
    })
  })

  it('deletes the deck and its cards only after the confirm is accepted', async () => {
    const services = await seed()
    const onDeleted = vi.fn()
    renderPage(services, onDeleted)

    await userEvent.click(await screen.findByRole('button', { name: 'Delete deck' }))
    // Resolves to the dialog's confirm, not the row that opened it: the open dialog takes the
    // page behind it out of the accessibility tree, so only one such button is queryable.
    await userEvent.click(await screen.findByRole('button', { name: 'Delete deck' }))

    await waitFor(() => {
      expect(services.deckStore.decks()).toHaveLength(0)
      expect(services.cardStore.cards()).toHaveLength(0)
    })
    expect(onDeleted).toHaveBeenCalled()
  })

  it('keeps the deck when the delete confirm is dismissed', async () => {
    const services = await seed()
    renderPage(services)

    await userEvent.click(await screen.findByRole('button', { name: 'Delete deck' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(services.deckStore.decks()).toHaveLength(1)
  })

  it('has no axe violations', async () => {
    const { container } = renderPage(await seed())
    await screen.findByRole('button', { name: 'Edit deck' })

    await expectNoA11yViolations(container)
  })
})
