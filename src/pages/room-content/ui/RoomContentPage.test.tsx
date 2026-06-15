import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createRoomStore, makeRoom, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, type Locus } from '@/entities/locus'
import { createQuestionStore, QuestionStoreContext, type Question } from '@/entities/question'
import { RoomContentPage } from './RoomContentPage'

afterEach(cleanup)

function renderPage(roomId = 'r1') {
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({
      id: 'r1',
      createdAt: new Date(0).toISOString(),
      palaceId: 'p1',
      title: 'Kitchen',
      order: 0,
    }),
  ])
  const locusRepo = new InMemoryRepository<Locus>()
  const questionRepo = new InMemoryRepository<Question>()
  render(
    <I18nextProvider i18n={i18n}>
      <RoomStoreContext value={createRoomStore(roomRepo)}>
        <LocusStoreContext value={createLocusStore(locusRepo)}>
          <QuestionStoreContext value={createQuestionStore(questionRepo)}>
            <RoomContentPage roomId={roomId} />
          </QuestionStoreContext>
        </LocusStoreContext>
      </RoomStoreContext>
    </I18nextProvider>,
  )
  return { locusRepo, questionRepo }
}

describe('RoomContentPage', () => {
  it('shows the room title', async () => {
    renderPage()
    expect(await screen.findByText('Kitchen')).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown room', async () => {
    renderPage('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })

  it('creates, edits, and deletes a locus (persisted)', async () => {
    const user = userEvent.setup()
    const { locusRepo } = renderPage()

    await user.type(screen.getByRole('textbox', { name: /new locus prompt/i }), 'Mihi')
    await user.type(screen.getByRole('textbox', { name: /new locus answer/i }), 'to me')
    await user.click(screen.getByRole('button', { name: /add locus/i }))
    expect(await screen.findByText('Mihi')).toBeInTheDocument()
    expect(await locusRepo.getAll()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /edit mihi/i }))
    const front = screen.getByRole('textbox', { name: /prompt \(front\)/i })
    await user.clear(front)
    await user.type(front, 'Tibi')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText('Tibi')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete tibi/i }))
    await waitFor(() => expect(screen.queryByText('Tibi')).not.toBeInTheDocument())
    expect(await locusRepo.getAll()).toHaveLength(0)
  })

  it('creates and deletes a question (persisted)', async () => {
    const user = userEvent.setup()
    const { questionRepo } = renderPage()

    await user.type(screen.getByRole('textbox', { name: /question prompt/i }), 'Capital of France?')
    await user.type(screen.getByRole('textbox', { name: /option 1/i }), 'Paris')
    await user.type(screen.getByRole('textbox', { name: /option 2/i }), 'Lyon')
    await user.click(screen.getByRole('button', { name: /add question/i }))

    expect(await screen.findByText('Capital of France?')).toBeInTheDocument()
    expect(await questionRepo.getAll()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /delete question/i }))
    await waitFor(() => expect(screen.queryByText('Capital of France?')).not.toBeInTheDocument())
    expect(await questionRepo.getAll()).toHaveLength(0)
  })
})
