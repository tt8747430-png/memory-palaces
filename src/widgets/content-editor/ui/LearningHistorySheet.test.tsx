import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createHistoryStore,
  type HistoryEntry,
  HistoryStoreContext,
  makeHistoryEntry,
} from '@/entities/learning-history'
import { started } from '@/shared/test/started'
import { LearningHistorySheet } from './LearningHistorySheet'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

type Draft = Omit<Parameters<typeof makeHistoryEntry>[0], 'cardId' | 'deckId'> & {
  cardId?: string
}

const entry = (draft: Draft): HistoryEntry =>
  makeHistoryEntry({ deckId: 'd1', cardId: 'c1', ...draft })

function renderSheet(entries: HistoryEntry[], cardId: string | null = 'c1', start = true) {
  const store = createHistoryStore(new InMemoryRepository<HistoryEntry>(entries))
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <HistoryStoreContext value={start ? started(store) : store}>
          <LearningHistorySheet open cardId={cardId} onOpenChange={() => {}} />
        </HistoryStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('LearningHistorySheet', () => {
  it('says a card has no history rather than inventing one', async () => {
    renderSheet([])
    expect(await screen.findByText('No history yet')).toBeInTheDocument()
  })

  it('shows placeholders, not an empty state, until the store has mirrored', () => {
    renderSheet([entry({ id: 'h1', createdAt: at(0), kind: 'graded', grade: 'good' })], 'c1', false)
    expect(screen.queryByText('No history yet')).not.toBeInTheDocument()
    expect(screen.queryByText('Good')).not.toBeInTheDocument()
  })

  it('lists this card’s answers and what each did to the schedule', async () => {
    renderSheet([
      entry({
        id: 'h1',
        createdAt: at(1),
        kind: 'graded',
        grade: 'good',
        intervalBefore: 1,
        intervalAfter: 3,
      }),
      entry({ id: 'h2', createdAt: at(0), kind: 'graded', grade: 'easy', intervalAfter: 2 }),
    ])

    expect(await screen.findByText('Good')).toBeInTheDocument()
    expect(screen.getByText('1d → 3d')).toBeInTheDocument()
    expect(screen.getByText('First review · 2d')).toBeInTheDocument()
    expect(screen.getByText(/2 answers/)).toBeInTheDocument()
  })

  it('calls an answer after a lapse what it is, not a first review', async () => {
    renderSheet([
      entry({
        id: 'h1',
        createdAt: at(0),
        kind: 'graded',
        grade: 'good',
        intervalBefore: 0,
        intervalAfter: 1,
      }),
    ])

    expect(await screen.findByText('now → 1d')).toBeInTheDocument()
    expect(screen.queryByText(/First review/)).not.toBeInTheDocument()
  })

  it('leaves another card’s answers out', async () => {
    renderSheet([
      entry({ id: 'h1', createdAt: at(0), cardId: 'c2', kind: 'graded', grade: 'again' }),
    ])
    expect(await screen.findByText('No history yet')).toBeInTheDocument()
  })

  it('reports a Fast answer as having moved no schedule', async () => {
    renderSheet([entry({ id: 'h1', createdAt: at(0), kind: 'answered', outcome: 'notQuite' })])
    expect(await screen.findByText('Not quite')).toBeInTheDocument()
    expect(screen.getByText('Fast review')).toBeInTheDocument()
  })

  it('shows a Mastered mark, which has no grade behind it', async () => {
    renderSheet([
      entry({
        id: 'h1',
        createdAt: at(0),
        kind: 'mastered',
        intervalBefore: 3,
        intervalAfter: 180,
      }),
    ])
    expect(await screen.findByText('Marked mastered')).toBeInTheDocument()
    expect(screen.getByText('3d → 6mo')).toBeInTheDocument()
  })
})
