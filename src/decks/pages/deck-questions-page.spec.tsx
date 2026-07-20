import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeck } from '@/decks/model/deck'
import { makeQuestion } from '@/decks/model/question'
import { OverlayHost } from '@/shared/ui'
import { DeckQuestionsPage } from './deck-questions-page'

const AT = '2026-07-16T00:00:00.000Z'
const noop = () => {}

function renderPage(services: Services) {
  return render(
    <MemoryRouter>
      <ServicesProvider services={services}>
        <DeckQuestionsPage
          deckId="d1"
          onBack={noop}
          onAddQuestion={noop}
          onEditQuestion={noop}
          onStartTest={noop}
        />
        <OverlayHost />
      </ServicesProvider>
    </MemoryRouter>,
  )
}

async function seed({ withQuestion }: { withQuestion: boolean }) {
  const services = createTestServices()
  services.deckStore.start()
  services.questionStore.start()
  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Capitals' }))
  if (withQuestion) {
    await services.questionStore.save(
      makeQuestion({
        id: 'q1',
        createdAt: AT,
        deckId: 'd1',
        prompt: 'Capital of France?',
        options: ['Paris', 'Lyon'],
        correctAnswer: 0,
      }),
    )
  }
  return services
}

describe('DeckQuestionsPage', () => {
  it('shows the empty state and a disabled test button when the deck has no questions', async () => {
    renderPage(await seed({ withQuestion: false }))

    expect(await screen.findByText('No questions yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start test' })).toBeDisabled()
  })

  it('lists the deck questions and enables the test', async () => {
    renderPage(await seed({ withQuestion: true }))

    expect(await screen.findByText('Capital of France?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start test' })).toBeEnabled()
  })

  it('has no axe violations', async () => {
    const { container } = renderPage(await seed({ withQuestion: true }))
    await screen.findByText('Capital of France?')

    await expectNoA11yViolations(container)
  })
})
