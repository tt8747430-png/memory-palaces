import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, makeRoom, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, makeLocus, type Locus } from '@/entities/locus'
import { RoomTrainPage } from './RoomTrainPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderTrain(roomId = 'r1') {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: at(0), name: 'Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Atrium', order: 0 }),
  ])
  const lociRepo = new InMemoryRepository<Locus>([
    makeLocus({ id: 'l1', createdAt: at(1), roomId: 'r1', front: 'Front 1', back: 'Back 1' }),
    makeLocus({ id: 'l2', createdAt: at(2), roomId: 'r1', front: 'Front 2', back: 'Back 2' }),
  ])
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
          <RoomStoreContext value={createRoomStore(roomRepo)}>
            <LocusStoreContext value={createLocusStore(lociRepo)}>
              <RoomTrainPage roomId={roomId} onBack={() => {}} />
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
  return { lociRepo }
}

describe('RoomTrainPage', () => {
  it('trains the room and persists SRS schedules through gradeCard', async () => {
    const user = userEvent.setup()
    const { lociRepo } = renderTrain()

    // Palace defaults to simple-sort, so the footer offers the two pile buttons.
    expect(await screen.findByText('Atrium')).toBeInTheDocument()
    expect(screen.getByText('Front 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /got it/i }))
    expect(await screen.findByText('Front 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /got it/i }))

    expect(await screen.findByText(/session complete/i)).toBeInTheDocument()
    await waitFor(async () => {
      const loci = await lociRepo.getAll()
      expect(loci.find((locus) => locus.id === 'l1')?.srs).toBeDefined()
      expect(loci.find((locus) => locus.id === 'l2')?.srs).toBeDefined()
    })
  })

  it('shows a not-found message for an unknown room', async () => {
    renderTrain('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })
})
