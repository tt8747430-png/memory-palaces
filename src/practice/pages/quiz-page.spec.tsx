import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import '@/shared/i18n'
import { createTestServices } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeck, makeQuestion } from '@/decks'
import { QuizPage } from './quiz-page'

const AT = '2026-07-18T00:00:00.000Z'

async function renderPage(deckId = 'd1') {
  const services = createTestServices()
  services.deckStore.start()
  services.questionStore.start()
  services.progressStore.start()
  services.preferencesStore.start()

  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Forum' }))
  await services.questionStore.save(
    makeQuestion({
      id: 'q1',
      createdAt: AT,
      deckId: 'd1',
      prompt: 'Capital of France?',
      options: ['Paris', 'Rome'],
      correctAnswer: 0,
    }),
  )

  return render(
    <MemoryRouter>
      <MotionConfig reducedMotion="always">
        <ServicesProvider services={services}>
          <QuizPage deckId={deckId} onBack={() => {}} />
        </ServicesProvider>
      </MotionConfig>
    </MemoryRouter>,
  )
}

describe('QuizPage', () => {
  it('builds the quiz from the deck subtree questions', async () => {
    await renderPage()
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /paris/i })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown deck', async () => {
    await renderPage('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderPage()
    await screen.findByText('Capital of France?')
    await expectNoA11yViolations(container)
  })
})
