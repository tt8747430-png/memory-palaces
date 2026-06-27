import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace, PalaceStoreContext } from '@/entities/palace'
import { createRoomStore, makeRoom, type Room, RoomStoreContext } from '@/entities/room'
import { createLocusStore, type Locus, LocusStoreContext, makeLocus } from '@/entities/locus'
import { MatchPage } from './MatchPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderMatch(roomId = 'r1') {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: at(0), name: 'Forum' }),
  ])
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Atrium', order: 0 }),
  ])
  const lociRepo = new InMemoryRepository<Locus>([
    makeLocus({ id: 'l1', createdAt: at(1), roomId: 'r1', front: 'Alpha', back: 'first letter' }),
    makeLocus({ id: 'l2', createdAt: at(2), roomId: 'r1', front: 'Beta', back: 'second letter' }),
  ])
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
          <RoomStoreContext value={createRoomStore(roomRepo)}>
            <LocusStoreContext value={createLocusStore(lociRepo)}>
              <MatchPage scope={{ kind: 'room', roomId }} onBack={() => {}} />
            </LocusStoreContext>
          </RoomStoreContext>
        </PalaceStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('MatchPage', () => {
  it('builds the board from the room loci', async () => {
    renderMatch()
    expect(await screen.findByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'first letter' })).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown room', async () => {
    renderMatch('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })
})
