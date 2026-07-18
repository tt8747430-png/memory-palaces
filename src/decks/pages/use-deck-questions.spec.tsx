import { describe, expect, it } from 'vitest'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@/shared/i18n'
import { createTestServices, type Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { OverlayHost } from '@/shared/ui'
import { makeDeck } from '@/decks/model/deck'
import { makeQuestion } from '@/decks/model/question'
import { useDeckQuestions } from './use-deck-questions'

const AT = '2026-07-16T00:00:00.000Z'

function wrapperFor(services: Services) {
  return ({ children }: { children: React.ReactNode }) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  )
}

async function arrange(questions: { id: string; prompt: string; order: number }[]) {
  const services = createTestServices()
  services.deckStore.start()
  services.questionStore.start()
  services.preferencesStore.start()
  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Garden' }))
  for (const question of questions) {
    await services.questionStore.save(
      makeQuestion({
        id: question.id,
        createdAt: AT,
        deckId: 'd1',
        prompt: question.prompt,
        options: ['a', 'b'],
        correctAnswer: 0,
        order: question.order,
      }),
    )
  }
  return services
}

const renderVm = (services: Services) =>
  renderHook(() => useDeckQuestions({ deckId: 'd1' }), { wrapper: wrapperFor(services) })

describe('useDeckQuestions', () => {
  it('scopes questions to the deck and sorts them by the chosen key', async () => {
    const services = await arrange([
      { id: 'q1', prompt: 'zeta', order: 0 },
      { id: 'q2', prompt: 'alpha', order: 1 },
    ])
    await services.questionStore.save(
      makeQuestion({
        id: 'other',
        createdAt: AT,
        deckId: 'd2',
        prompt: 'elsewhere',
        options: ['a', 'b'],
        correctAnswer: 0,
      }),
    )
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.questions).toHaveLength(2))

    expect(result.current.sortedQuestions.map((q) => q.id)).toEqual(['q1', 'q2'])

    act(() => {
      result.current.setSort('name')
    })

    expect(result.current.sortedQuestions.map((q) => q.id)).toEqual(['q2', 'q1'])
  })

  it('reorders through the command, persisting one order per id', async () => {
    const services = await arrange([
      { id: 'q1', prompt: 'first', order: 0 },
      { id: 'q2', prompt: 'second', order: 1 },
      { id: 'q3', prompt: 'third', order: 2 },
    ])
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.questions).toHaveLength(3))

    act(() => {
      result.current.onReorder(['q3', 'q1', 'q2'])
    })

    // Synchronously after the drop — the optimistic patch, not the persisted rows.
    expect(result.current.sortedQuestions.map((q) => q.id)).toEqual(['q3', 'q1', 'q2'])

    await waitFor(() => {
      const byId = new Map(services.questionStore.questions().map((q) => [q.id, q]))
      expect(byId.get('q3')?.order).toBe(0)
      expect(byId.get('q1')?.order).toBe(1)
      expect(byId.get('q2')?.order).toBe(2)
    })
  })

  it('switches a non-manual sort back to manual when the learner drags a row', async () => {
    const services = await arrange([
      { id: 'q1', prompt: 'first', order: 0 },
      { id: 'q2', prompt: 'second', order: 1 },
    ])
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.questions).toHaveLength(2))

    act(() => {
      result.current.setSort('name')
    })
    act(() => {
      result.current.onReorder(['q2', 'q1'])
    })

    expect(result.current.sort).toBe('manual')
  })

  it('deletes the whole selection through one bulk command and leaves select mode', async () => {
    const services = await arrange([
      { id: 'q1', prompt: 'one', order: 0 },
      { id: 'q2', prompt: 'two', order: 1 },
      { id: 'q3', prompt: 'three', order: 2 },
    ])
    render(
      <ServicesProvider services={services}>
        <OverlayHost />
      </ServicesProvider>,
    )
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.questions).toHaveLength(3))

    act(() => {
      result.current.requestSelect('q1')
    })
    act(() => {
      result.current.toggleSelect('q2')
    })
    expect(result.current.selectMode).toBe(true)
    expect(result.current.selectedCount).toBe(2)

    act(() => {
      void result.current.deleteSelected()
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(services.questionStore.questions().map((q) => q.id)).toEqual(['q3'])
    })
    expect(result.current.selectMode).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('selects and clears every question, and drops the selection on exit', async () => {
    const services = await arrange([
      { id: 'q1', prompt: 'one', order: 0 },
      { id: 'q2', prompt: 'two', order: 1 },
    ])
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.questions).toHaveLength(2))

    act(() => {
      result.current.toggleSelectAll()
    })
    expect(result.current.allSelected).toBe(true)

    act(() => {
      result.current.toggleSelectAll()
    })
    expect(result.current.selectedCount).toBe(0)
  })

  it('duplicates the selection with one bulk command', async () => {
    const services = await arrange([
      { id: 'q1', prompt: 'one', order: 0 },
      { id: 'q2', prompt: 'two', order: 1 },
    ])
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.questions).toHaveLength(2))

    act(() => {
      result.current.toggleSelectAll()
    })
    act(() => {
      result.current.selectHandlers.duplicate?.onAction()
    })

    await waitFor(() => expect(services.questionStore.questions()).toHaveLength(4))
    expect(result.current.selectMode).toBe(false)
  })
})
