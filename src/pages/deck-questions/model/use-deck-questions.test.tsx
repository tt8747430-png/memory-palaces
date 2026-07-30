import type { ReactNode } from 'react'
import { started } from '@/shared/test/started'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import {
  createQuestionStore,
  makeQuestion,
  type Question,
  QuestionStoreContext,
} from '@/entities/question'
import { useDeckQuestions } from './use-deck-questions'

afterEach(cleanup)

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/shared/lib/haptics', () => ({
  impact: vi.fn(),
  tick: vi.fn(),
  success: vi.fn(),
  setHapticsEnabled: vi.fn(),
}))

const at = (ms: number) => new Date(ms).toISOString()

const question = (id: string, prompt: string, order: number) =>
  makeQuestion({
    id,
    createdAt: at(order),
    deckId: 'd1',
    prompt,
    options: ['a', 'b'],
    correctAnswer: 0,
    order,
  })

function renderQuestions(questions: Question[]) {
  const decks: Deck[] = [makeDeck({ id: 'd1', createdAt: at(0), name: 'Latin' })]
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <DeckStoreContext value={started(createDeckStore(new InMemoryRepository<Deck>(decks)))}>
          <QuestionStoreContext
            value={started(createQuestionStore(new InMemoryRepository<Question>(questions)))}
          >
            <CardStoreContext value={started(createCardStore(new InMemoryRepository<Card>([])))}>
              {children}
            </CardStoreContext>
          </QuestionStoreContext>
        </DeckStoreContext>
      </I18nextProvider>
    )
  }
  return renderHook(() => useDeckQuestions('d1'), { wrapper: Wrapper })
}

describe('useDeckQuestions', () => {
  it('names the Deck and lists its Questions in the stored order', async () => {
    const { result } = renderQuestions([question('q2', 'Second', 1), question('q1', 'First', 0)])
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.deckName).toBe('Latin')
    expect(result.current.questions.map((q) => q.prompt)).toEqual(['First', 'Second'])
  })

  it('re-sorts by name without touching what is stored', async () => {
    const { result } = renderQuestions([question('q1', 'Beta', 0), question('q2', 'Alpha', 1)])
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.setSort('name'))
    expect(result.current.questions.map((q) => q.prompt)).toEqual(['Alpha', 'Beta'])
  })

  it('a reorder switches the sort to manual', async () => {
    const { result } = renderQuestions([question('q1', 'Beta', 0), question('q2', 'Alpha', 1)])
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.setSort('name'))

    act(() => result.current.reorder(['q2', 'q1']))
    expect(result.current.sort).toBe('manual')
  })

  it('holds one pending act at a time and clears it on dismiss', async () => {
    const { result } = renderQuestions([question('q1', 'First', 0)])
    await waitFor(() => expect(result.current.ready).toBe(true))
    const target = result.current.questions[0]!

    act(() => result.current.request({ kind: 'delete-question', question: target }))
    expect(result.current.pending?.kind).toBe('delete-question')

    act(() => result.current.request({ kind: 'delete-selection' }))
    expect(result.current.pending?.kind).toBe('delete-selection')

    act(() => result.current.dismiss())
    expect(result.current.pending).toBeNull()
  })

  it('confirming a delete removes the Question and clears the act', async () => {
    const { result } = renderQuestions([question('q1', 'First', 0), question('q2', 'Second', 1)])
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() =>
      result.current.request({ kind: 'delete-question', question: result.current.questions[0]! }),
    )
    act(() => result.current.confirm())

    expect(result.current.pending).toBeNull()
    await waitFor(() => expect(result.current.questions.map((q) => q.id)).toEqual(['q2']))
  })

  it('deleting a Selection clears the Selection too', async () => {
    const { result } = renderQuestions([question('q1', 'First', 0), question('q2', 'Second', 1)])
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.selection.begin('q1'))
    act(() => result.current.request({ kind: 'delete-selection' }))
    act(() => result.current.confirm())

    expect(result.current.selection.active).toBe(false)
    await waitFor(() => expect(result.current.questions.map((q) => q.id)).toEqual(['q2']))
  })

  it('offers no bulk action while nothing is selected', async () => {
    const { result } = renderQuestions([question('q1', 'First', 0)])
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.selectHandlers.delete?.disabled).toBe(true)

    act(() => result.current.selection.begin('q1'))
    expect(result.current.selectHandlers.delete?.disabled).toBe(false)
  })
})
