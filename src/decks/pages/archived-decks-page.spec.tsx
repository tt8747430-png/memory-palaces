import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeck } from '@/decks/model/deck'
import { OverlayHost } from '@/shared/ui'
import { ArchivedDecksPage } from './archived-decks-page'

const AT = '2026-07-16T00:00:00.000Z'

function renderPage(services: Services) {
  return render(
    <MemoryRouter>
      <ServicesProvider services={services}>
        <ArchivedDecksPage onBack={() => {}} />
        <OverlayHost />
      </ServicesProvider>
    </MemoryRouter>,
  )
}

async function seed(decks: { id: string; name: string; archived: boolean; parentId?: string }[]) {
  const services = createTestServices()
  services.deckStore.start()
  services.cardStore.start()
  for (const deck of decks) {
    await services.deckStore.save(
      makeDeck({
        id: deck.id,
        createdAt: AT,
        name: deck.name,
        archived: deck.archived,
        parentId: deck.parentId ?? null,
      }),
    )
  }
  return services
}

describe('ArchivedDecksPage', () => {
  it('shows the empty state when nothing is archived', async () => {
    renderPage(await seed([{ id: 'd1', name: 'Capitals', archived: false }]))

    expect(await screen.findByText('Nothing archived')).toBeInTheDocument()
  })

  it('lists only the root of an archived subtree', async () => {
    renderPage(
      await seed([
        { id: 'd1', name: 'Capitals', archived: true },
        { id: 'd2', name: 'Europe', archived: true, parentId: 'd1' },
        { id: 'd3', name: 'Active', archived: false },
      ]),
    )

    expect(await screen.findByText('Capitals')).toBeInTheDocument()
    // The archived child rides along with its parent — it is not its own entry.
    expect(screen.queryByText('Europe')).not.toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('restores a deck through the command', async () => {
    const services = await seed([{ id: 'd1', name: 'Capitals', archived: true }])
    renderPage(services)

    await userEvent.click(await screen.findByRole('button', { name: 'Restore' }))

    await waitFor(() => expect(services.deckStore.decks()[0]?.archived).toBe(false))
  })

  it('has no axe violations', async () => {
    const { container } = renderPage(await seed([{ id: 'd1', name: 'Capitals', archived: true }]))
    await screen.findByText('Capitals')

    await expectNoA11yViolations(container)
  })
})
