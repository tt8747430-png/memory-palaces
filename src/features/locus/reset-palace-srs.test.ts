import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { srsStatus } from '@/shared/lib'
import { createRoomStore, type Room } from '@/entities/room'
import { createLocusStore, lociForRoom, type Locus, selectLoci } from '@/entities/locus'
import { createRoom } from '@/features/room/create-room'
import { createLocus } from './create-locus'
import { markRoomKnown } from './mark-room-known'
import { resetPalaceSrs } from './reset-palace-srs'

function stores() {
  const roomStore = createRoomStore(new InMemoryRepository<Room>())
  const locusStore = createLocusStore(new InMemoryRepository<Locus>())
  roomStore.getState().start()
  locusStore.getState().start()
  return { roomStore, locusStore }
}

describe('resetPalaceSrs', () => {
  it('clears the schedule of every card in the palace, leaving other palaces untouched', async () => {
    const { roomStore, locusStore } = stores()
    const roomA = await createRoom(roomStore, 'p1', { title: 'A' })
    const roomB = await createRoom(roomStore, 'p1', { title: 'B' })
    const otherRoom = await createRoom(roomStore, 'p2', { title: 'Other' })

    await createLocus(locusStore, roomA.id, { front: 'a', back: 'A' })
    await createLocus(locusStore, roomB.id, { front: 'b', back: 'B' })
    const kept = await createLocus(locusStore, otherRoom.id, { front: 'c', back: 'C' })
    await markRoomKnown(locusStore, roomA.id)
    await markRoomKnown(locusStore, roomB.id)
    await markRoomKnown(locusStore, otherRoom.id)

    await resetPalaceSrs(roomStore, locusStore, 'p1')

    const p1Loci = [
      ...lociForRoom(selectLoci(locusStore.getState()), roomA.id),
      ...lociForRoom(selectLoci(locusStore.getState()), roomB.id),
    ]
    expect(p1Loci.every((locus) => srsStatus(locus.srs) === 'new')).toBe(true)

    const untouched = selectLoci(locusStore.getState()).find((locus) => locus.id === kept.id)
    expect(srsStatus(untouched?.srs)).toBe('known')
  })

  it('is a no-op for a palace with no rooms', async () => {
    const { roomStore, locusStore } = stores()
    await expect(resetPalaceSrs(roomStore, locusStore, 'empty')).resolves.toBeUndefined()
  })
})
