import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createLocusStore, LocusStoreContext, makeLocus, type Locus } from '@/entities/locus'
import { createQuestionStore, QuestionStoreContext, type Question } from '@/entities/question'
import { RoomContentEditor } from './RoomContentEditor'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderEditor({
  loci = [] as Locus[],
  questions = [] as Question[],
}: { loci?: Locus[]; questions?: Question[] } = {}) {
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <LocusStoreContext value={createLocusStore(new InMemoryRepository<Locus>(loci))}>
          <QuestionStoreContext value={createQuestionStore(new InMemoryRepository<Question>(questions))}>
            <RoomContentEditor roomId="r1" roomName="Garden Room" />
          </QuestionStoreContext>
        </LocusStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('RoomContentEditor', () => {
  it('lists a room’s cards with a quick-add row', async () => {
    renderEditor({
      loci: [makeLocus({ id: 'l1', createdAt: at(1), roomId: 'r1', front: 'mihi', back: 'to me', order: 0 })],
    })

    expect(await screen.findByText('mihi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cards · 1/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/front — what to recall/i)).toBeInTheDocument()
  })

  it('adds a card through the quick-add row', async () => {
    const user = userEvent.setup()
    renderEditor({
      loci: [makeLocus({ id: 'l1', createdAt: at(1), roomId: 'r1', front: 'seed', back: 'root', order: 0 })],
    })
    await screen.findByText('seed')

    await user.type(screen.getByLabelText(/front — what to recall/i), 'novum')
    await user.type(screen.getByLabelText(/back — what it means/i), 'new{Enter}')

    expect(await screen.findByText('novum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cards · 2/i })).toBeInTheDocument()
  })

  it('switches to the Questions tab and teaches the empty state', async () => {
    const user = userEvent.setup()
    renderEditor({
      loci: [makeLocus({ id: 'l1', createdAt: at(1), roomId: 'r1', front: 'a', back: 'A', order: 0 })],
    })
    await screen.findByText('a')

    await user.click(screen.getByRole('button', { name: /questions · 0/i }))
    expect(await screen.findByText(/no questions yet/i)).toBeInTheDocument()
  })

  it('shows the cards empty state for a fresh room', async () => {
    renderEditor()
    expect(await screen.findByRole('heading', { name: /no cards yet/i })).toBeInTheDocument()
  })
})
