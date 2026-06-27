import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace, PalaceStoreContext } from '@/entities/palace'
import { createRoomStore, makeRoom, type Room, RoomStoreContext } from '@/entities/room'
import { createLocusStore, type Locus, LocusStoreContext } from '@/entities/locus'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { PalaceDetailPage } from './PalaceDetailPage'

afterEach(cleanup)

const room = (id: string, palaceId: string, order: number, title = id): Room =>
  makeRoom({ id, createdAt: new Date(0).toISOString(), palaceId, title, order })

function renderDetail({ palaceId = 'p1', rooms = [] as Room[] } = {}) {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: new Date(0).toISOString(), name: 'Roman Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>(rooms)
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
          <RoomStoreContext value={createRoomStore(roomRepo)}>
            <LocusStoreContext value={createLocusStore(new InMemoryRepository<Locus>())}>
              <QuestionStoreContext value={createQuestionStore(new InMemoryRepository<Question>())}>
                <PalaceDetailPage palaceId={palaceId} />
              </QuestionStoreContext>
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
  return { roomRepo }
}

const roomTitles = () =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

describe('PalaceDetailPage', () => {
  it('shows the palace name', async () => {
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Roman Forum' })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown palace', async () => {
    renderDetail({ palaceId: 'nope' })
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })

  it('creates a room through the editor sheet and persists it', async () => {
    const user = userEvent.setup()
    const { roomRepo } = renderDetail()
    await screen.findByRole('heading', { name: 'Roman Forum' })

    // Adding always lives in the speed-dial (the empty state is teaching-only now).
    await user.click(screen.getByRole('button', { name: /quick actions/i }))
    await user.click(await screen.findByRole('button', { name: /add room/i }))
    const sheet = await screen.findByRole('dialog')
    await user.type(within(sheet).getByRole('textbox', { name: /room name/i }), 'Kitchen')
    await user.click(within(sheet).getByRole('button', { name: /add room/i }))

    expect(await screen.findByRole('heading', { name: 'Kitchen' })).toBeInTheDocument()
    await waitFor(async () => expect(await roomRepo.getAll()).toHaveLength(1))
  })

  it('reorders rooms through the overflow menu', async () => {
    const user = userEvent.setup()
    renderDetail({ rooms: [room('r1', 'p1', 0, 'Kitchen'), room('r2', 'p1', 1, 'Hallway')] })
    await screen.findByRole('heading', { name: 'Kitchen' })
    expect(roomTitles()).toEqual(['Kitchen', 'Hallway'])

    await user.click(screen.getByRole('button', { name: /hallway actions/i }))
    await user.click(await screen.findByRole('menuitem', { name: /move up/i }))

    await waitFor(() => expect(roomTitles()).toEqual(['Hallway', 'Kitchen']))
  })

  it('deletes a room through the menu and confirm dialog', async () => {
    const user = userEvent.setup()
    const { roomRepo } = renderDetail({ rooms: [room('r1', 'p1', 0, 'Kitchen')] })
    await screen.findByRole('heading', { name: 'Kitchen' })

    await user.click(screen.getByRole('button', { name: /kitchen actions/i }))
    await user.click(await screen.findByRole('menuitem', { name: /delete room/i }))

    // The confirm dialog carries the room name in its title; click its confirm button.
    const confirmTitle = await screen.findByText(/delete .kitchen.\?/i)
    const dialog = confirmTitle.closest('[role="dialog"]') as HTMLElement
    await user.click(within(dialog).getByRole('button', { name: /delete room/i }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Kitchen' })).not.toBeInTheDocument(),
    )
    expect(await roomRepo.getAll()).toHaveLength(0)
  })
})
