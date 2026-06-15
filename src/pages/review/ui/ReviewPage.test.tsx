import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import type { SrsState } from '@/shared/lib'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, makeRoom, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, makeLocus, type Locus } from '@/entities/locus'
import { ReviewPage } from './ReviewPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()
const DAY = 86_400_000
const NOW = Date.now()

const futureSrs: SrsState = {
  due: at(NOW + 10 * DAY),
  interval: 10,
  ease: 2.5,
  reps: 3,
  lapses: 0,
  lastReviewed: at(NOW - DAY),
}

function renderReview(loci: Locus[]) {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: at(0), name: 'Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Atrium', order: 0 }),
  ])
  const lociRepo = new InMemoryRepository<Locus>(loci)
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
          <RoomStoreContext value={createRoomStore(roomRepo)}>
            <LocusStoreContext value={createLocusStore(lociRepo)}>
              <ReviewPage onBack={() => {}} />
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
  return { lociRepo }
}

describe('ReviewPage', () => {
  it('surfaces the cross-library due queue and grades through gradeCard', async () => {
    const user = userEvent.setup()
    const { lociRepo } = renderReview([
      makeLocus({ id: 'l1', createdAt: at(1), roomId: 'r1', front: 'Front 1', back: 'Back 1' }),
    ])

    expect(await screen.findByText('Daily Review')).toBeInTheDocument()
    expect(screen.getByText('Front 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show answer/i }))
    await user.click(screen.getByRole('button', { name: /good/i }))

    await waitFor(async () => {
      const loci = await lociRepo.getAll()
      expect(loci.find((locus) => locus.id === 'l1')?.srs).toBeDefined()
    })
  })

  it('shows the caught-up state when nothing is due', async () => {
    renderReview([
      makeLocus({
        id: 'l1',
        createdAt: at(1),
        roomId: 'r1',
        front: 'Front 1',
        back: 'Back 1',
        srs: futureSrs,
      }),
    ])

    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument()
  })
})
