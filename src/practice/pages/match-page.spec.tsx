import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import '@/shared/i18n'
import { createTestServices } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeCard, makeDeck } from '@/decks'
import { MatchPage } from './match-page'

const AT = '2026-07-18T00:00:00.000Z'

async function renderPage(deckId = 'd2') {
  const services = createTestServices()
  services.deckStore.start()
  services.cardStore.start()
  services.progressStore.start()
  services.preferencesStore.start()

  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Forum' }))
  await services.deckStore.save(
    makeDeck({ id: 'd2', createdAt: AT, name: 'Atrium', parentId: 'd1' }),
  )
  await services.cardStore.save(
    makeCard({ id: 'c1', createdAt: AT, deckId: 'd2', front: 'Alpha', back: 'first letter' }),
  )
  await services.cardStore.save(
    makeCard({ id: 'c2', createdAt: AT, deckId: 'd2', front: 'Beta', back: 'second letter' }),
  )

  return render(
    <MemoryRouter>
      <MotionConfig reducedMotion="always">
        <ServicesProvider services={services}>
          <MatchPage deckId={deckId} onBack={() => {}} />
        </ServicesProvider>
      </MotionConfig>
    </MemoryRouter>,
  )
}

describe('MatchPage', () => {
  it('renders the board with the deck path as subtitle', async () => {
    await renderPage()
    expect(await screen.findByText('Forum · Atrium')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'second letter' })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown deck', async () => {
    await renderPage('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderPage()
    await screen.findByText('Forum · Atrium')
    await expectNoA11yViolations(container)
  })
})
