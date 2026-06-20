import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createPalaceStore,
  makePalace,
  PalaceStoreContext,
  type Palace,
} from '@/entities/palace'
import { createFolderStore, FolderStoreContext, type Folder } from '@/entities/folder'
import { createRoomStore, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, type Locus } from '@/entities/locus'
import {
  createPreferencesStore,
  PreferencesStoreContext,
  type Preferences,
} from '@/entities/preferences'
import { PalacesPage } from './PalacesPage'

afterEach(cleanup)

const palace = (id: string, name: string, over: Partial<Parameters<typeof makePalace>[0]> = {}): Palace =>
  makePalace({ id, createdAt: new Date(0).toISOString(), name, ...over })

function setup(seed: Palace[] = []) {
  const palaceRepo = new InMemoryRepository<Palace>(seed)
  const palaceStore = createPalaceStore(palaceRepo)
  const folderStore = createFolderStore(new InMemoryRepository<Folder>())
  const roomStore = createRoomStore(new InMemoryRepository<Room>())
  const locusStore = createLocusStore(new InMemoryRepository<Locus>())
  const prefStore = createPreferencesStore(new InMemoryRepository<Preferences>())
  const onOpenPalace = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceStoreContext value={palaceStore}>
        <FolderStoreContext value={folderStore}>
          <RoomStoreContext value={roomStore}>
            <LocusStoreContext value={locusStore}>
              <PreferencesStoreContext value={prefStore}>
                <PalacesPage onOpenPalace={onOpenPalace} />
              </PreferencesStoreContext>
            </LocusStoreContext>
          </RoomStoreContext>
        </FolderStoreContext>
      </PalaceStoreContext>
    </I18nextProvider>,
  )
  return { palaceRepo, onOpenPalace }
}

describe('PalacesPage', () => {
  it('shows the first-run empty state when there are no palaces', async () => {
    setup()
    expect(await screen.findByText(/build your first palace/i)).toBeInTheDocument()
  })

  it('renders seeded palaces', async () => {
    setup([palace('a', 'Roman Forum'), palace('b', 'Solar System')])
    expect(await screen.findByText('Roman Forum')).toBeInTheDocument()
    expect(screen.getByText('Solar System')).toBeInTheDocument()
  })

  it('creates a palace through the sheet, persists it, and opens it', async () => {
    const user = userEvent.setup()
    // Seed one palace so the first-run empty-state CTA (also named "Create palace") is
    // gone, leaving only the header + button to disambiguate the open.
    const { palaceRepo, onOpenPalace } = setup([palace('seed', 'Seeded')])
    await screen.findByText('Seeded')

    await user.click(screen.getByRole('button', { name: /create palace/i }))
    const sheet = await screen.findByRole('dialog')
    await user.type(within(sheet).getByRole('textbox', { name: /name/i }), 'Memory Lane')
    await user.click(within(sheet).getByRole('button', { name: /create palace/i }))

    await waitFor(async () => expect(await palaceRepo.getAll()).toHaveLength(2))
    expect(onOpenPalace).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Memory Lane')).toBeInTheDocument()
  })

  it('filters to favorites via the collection rail', async () => {
    const user = userEvent.setup()
    setup([palace('a', 'Loved', { favorite: true }), palace('b', 'Plain')])

    await screen.findByText('Loved')
    await user.click(screen.getByRole('tab', { name: /favorites/i }))

    expect(screen.getByText('Loved')).toBeInTheDocument()
    expect(screen.queryByText('Plain')).not.toBeInTheDocument()
  })
})
