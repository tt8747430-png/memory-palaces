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
import {
  createPreferencesStore,
  PreferencesStoreContext,
  type Preferences,
} from '@/entities/preferences'
import { VerseStudyPage } from './VerseStudyPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function renderVerse(roomId = 'r1') {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: at(0), name: 'Scripture' }),
  ])
  const roomRepo = new InMemoryRepository<Room>([
    makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Psalms', order: 0 }),
  ])
  const lociRepo = new InMemoryRepository<Locus>([
    makeLocus({
      id: 'l1',
      createdAt: at(1),
      roomId: 'r1',
      front: 'Psalm 23:1',
      back: 'The Lord is my shepherd',
    }),
  ])
  const prefsRepo = new InMemoryRepository<Preferences>([])
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PreferencesStoreContext value={createPreferencesStore(prefsRepo)}>
          <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
            <RoomStoreContext value={createRoomStore(roomRepo)}>
              <LocusStoreContext value={createLocusStore(lociRepo)}>
                <VerseStudyPage scope={{ kind: 'room', roomId }} onBack={() => {}} />
              </LocusStoreContext>
            </RoomStoreContext>
          </PalaceStoreContext>
        </PreferencesStoreContext>
      </MotionConfig>
    </I18nextProvider>,
  )
  return { lociRepo }
}

describe('VerseStudyPage', () => {
  it('builds verses from the room loci and persists the memorized marker', async () => {
    const user = userEvent.setup()
    const { lociRepo } = renderVerse()

    expect(await screen.findByText('Psalm 23:1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /mark memorized/i }))
    await waitFor(async () => {
      const loci = await lociRepo.getAll()
      expect(loci.find((locus) => locus.id === 'l1')?.memorized).toBe(true)
    })
  })

  it('shows a not-found message for an unknown room', async () => {
    renderVerse('nope')
    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
  })
})
