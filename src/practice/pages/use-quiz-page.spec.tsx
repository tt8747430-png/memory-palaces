import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import '@/shared/i18n'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { makeDeck, makeQuestion } from '@/decks'
import { useQuizPage } from './use-quiz-page'

const AT = '2026-07-18T00:00:00.000Z'

async function setup() {
  const services = createTestServices()
  services.deckStore.start()
  services.questionStore.start()
  services.progressStore.start()
  services.preferencesStore.start()

  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Forum' }))
  await services.deckStore.save(
    makeDeck({ id: 'd2', createdAt: AT, name: 'Atrium', parentId: 'd1' }),
  )
  await services.deckStore.save(makeDeck({ id: 'other', createdAt: AT, name: 'Elsewhere' }))

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
  await services.questionStore.save(
    makeQuestion({
      id: 'q2',
      createdAt: AT,
      deckId: 'd2',
      prompt: '2 + 2?',
      options: ['3', '4'],
      correctAnswer: 1,
    }),
  )
  await services.questionStore.save(
    makeQuestion({
      id: 'q3',
      createdAt: AT,
      deckId: 'other',
      prompt: 'Not in the subtree',
      options: ['a', 'b'],
      correctAnswer: 0,
    }),
  )
  return services
}

function renderVm(services: Services, deckId = 'd1') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  )
  return renderHook(() => useQuizPage(deckId), { wrapper })
}

describe('useQuizPage', () => {
  it('builds the run from the deck subtree and excludes other decks', async () => {
    const services = await setup()
    const { result } = renderVm(services)

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.questions.map((each) => each.id).sort()).toEqual(['q1', 'q2'])
    expect(result.current.questions.find((each) => each.id === 'q2')?.deckName).toBe('Atrium')
  })

  it('freezes the run so a later question write cannot resize it', async () => {
    const services = await setup()
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.questions).toHaveLength(2)

    await act(async () => {
      await services.questionStore.save(
        makeQuestion({
          id: 'q4',
          createdAt: AT,
          deckId: 'd1',
          prompt: 'Added mid-run',
          options: ['x', 'y'],
          correctAnswer: 0,
        }),
      )
    })

    expect(result.current.questions).toHaveLength(2)
  })

  it('reports a missing deck rather than throwing', async () => {
    const services = await setup()
    const { result } = renderVm(services, 'nope')

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.deck).toBeUndefined()
    expect(result.current.questions).toEqual([])
  })

  it('writes a settings toggle through to the deck', async () => {
    const services = await setup()
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.autoAdvance).toBe(true)

    await act(async () => result.current.setQuizTimer(false))

    await waitFor(() =>
      expect(services.deckStore.decks().find((each) => each.id === 'd1')?.settings.quizTimer).toBe(
        false,
      ),
    )
  })

  it('inherits a parent deck setting down the subtree', async () => {
    const services = await setup()
    await services.deckStore.save({
      ...services.deckStore.decks().find((each) => each.id === 'd1')!,
      settings: { quizTimer: false },
    })
    const { result } = renderVm(services, 'd2')

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.autoAdvance).toBe(false)
  })
})
