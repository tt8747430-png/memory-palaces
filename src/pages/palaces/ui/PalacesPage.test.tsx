import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace, PalaceStoreContext } from '@/entities/palace'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createRoomStore, type Room, RoomStoreContext } from '@/entities/room'
import { createLocusStore, type Locus, LocusStoreContext } from '@/entities/locus'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import { createProfileStore, type Profile, ProfileStoreContext } from '@/entities/profile'
import { createProgressStore, type Progress, ProgressStoreContext } from '@/entities/progress'
import {
  type AppNotification,
  createNotificationStore,
  NotificationStoreContext,
} from '@/entities/notification'
import { PalacesPage } from './PalacesPage'

afterEach(cleanup)

const palace = (
  id: string,
  name: string,
  over: Partial<Parameters<typeof makePalace>[0]> = {},
): Palace => makePalace({ id, createdAt: new Date(0).toISOString(), name, ...over })

const folder = (id: string, name: string): Folder => ({
  id,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  name,
  color: 'blue',
  icon: '📁',
  order: 0,
})

function setup(seed: Palace[] = [], folders: Folder[] = [], folderId: string | null = null) {
  const palaceRepo = new InMemoryRepository<Palace>(seed)
  const palaceStore = createPalaceStore(palaceRepo)
  const folderStore = createFolderStore(new InMemoryRepository<Folder>(folders))
  const roomStore = createRoomStore(new InMemoryRepository<Room>())
  const locusStore = createLocusStore(new InMemoryRepository<Locus>())
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  const prefStore = createPreferencesStore(new InMemoryRepository<Preferences>())
  const sessionStore = createSessionStore(new InMemoryRepository<Session>())
  const profileStore = createProfileStore(new InMemoryRepository<Profile>())
  const progressStore = createProgressStore(new InMemoryRepository<Progress>())
  const notificationStore = createNotificationStore(new InMemoryRepository<AppNotification>())
  const onOpenPalace = vi.fn()
  const onOpenFolder = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceStoreContext value={palaceStore}>
        <FolderStoreContext value={folderStore}>
          <RoomStoreContext value={roomStore}>
            <LocusStoreContext value={locusStore}>
              <QuestionStoreContext value={questionStore}>
                <PreferencesStoreContext value={prefStore}>
                  <SessionStoreContext value={sessionStore}>
                    <ProfileStoreContext value={profileStore}>
                      <ProgressStoreContext value={progressStore}>
                        <NotificationStoreContext value={notificationStore}>
                          <PalacesPage
                            onOpenPalace={onOpenPalace}
                            onOpenFolder={onOpenFolder}
                            folderId={folderId}
                          />
                        </NotificationStoreContext>
                      </ProgressStoreContext>
                    </ProfileStoreContext>
                  </SessionStoreContext>
                </PreferencesStoreContext>
              </QuestionStoreContext>
            </LocusStoreContext>
          </RoomStoreContext>
        </FolderStoreContext>
      </PalaceStoreContext>
    </I18nextProvider>,
  )
  return { palaceRepo, onOpenPalace, onOpenFolder }
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

  it('creates a palace through the sheet, persists it, and stays in the library', async () => {
    const user = userEvent.setup()
    const { palaceRepo, onOpenPalace } = setup([palace('seed', 'Seeded')])
    await screen.findByText('Seeded')

    // Create lives in the bottom-right speed-dial: open it, then pick "Create palace".
    await user.click(screen.getByRole('button', { name: /quick actions/i }))
    await user.click(await screen.findByRole('button', { name: /create palace/i }))
    const sheet = await screen.findByRole('dialog')
    await user.type(within(sheet).getByRole('textbox', { name: /name/i }), 'Memory Lane')
    await user.click(within(sheet).getByRole('button', { name: /create palace/i }))

    await waitFor(async () => expect(await palaceRepo.getAll()).toHaveLength(2))
    // Creating keeps you where you are — the new palace appears in the grid, no navigation.
    expect(await screen.findByText('Memory Lane')).toBeInTheDocument()
    expect(onOpenPalace).not.toHaveBeenCalled()
  })

  it('shows folders and unfiled palaces at the root, hiding filed palaces', async () => {
    const user = userEvent.setup()
    const { onOpenFolder } = setup(
      [palace('a', 'Filed Away', { folderId: 'f1' }), palace('b', 'At Root')],
      [folder('f1', 'Languages')],
    )

    // Root shows the folder card and the unfiled palace, but not the filed one.
    expect(await screen.findByText('Languages')).toBeInTheDocument()
    expect(screen.getByText('At Root')).toBeInTheDocument()
    expect(screen.queryByText('Filed Away')).not.toBeInTheDocument()

    // Tapping the folder drills into it.
    await user.click(screen.getByRole('button', { name: /open folder languages/i }))
    expect(onOpenFolder).toHaveBeenCalledWith('f1')
  })

  it('shows a folder’s palaces when opened into that folder', async () => {
    setup(
      [palace('a', 'Filed Away', { folderId: 'f1' }), palace('b', 'At Root')],
      [folder('f1', 'Languages')],
      'f1',
    )

    // Inside the folder: its palace shows, the root palace and folder card do not.
    expect(await screen.findByText('Filed Away')).toBeInTheDocument()
    expect(screen.queryByText('At Root')).not.toBeInTheDocument()
  })
})
