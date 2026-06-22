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
import { createQuestionStore, QuestionStoreContext, type Question } from '@/entities/question'
import {
  createPreferencesStore,
  PreferencesStoreContext,
  type Preferences,
} from '@/entities/preferences'
import { createSessionStore, SessionStoreContext, type Session } from '@/entities/session'
import { createProfileStore, ProfileStoreContext, type Profile } from '@/entities/profile'
import { createProgressStore, ProgressStoreContext, type Progress } from '@/entities/progress'
import {
  createNotificationStore,
  NotificationStoreContext,
  type AppNotification,
} from '@/entities/notification'
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
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  const prefStore = createPreferencesStore(new InMemoryRepository<Preferences>())
  const sessionStore = createSessionStore(new InMemoryRepository<Session>())
  const profileStore = createProfileStore(new InMemoryRepository<Profile>())
  const progressStore = createProgressStore(new InMemoryRepository<Progress>())
  const notificationStore = createNotificationStore(new InMemoryRepository<AppNotification>())
  const onOpenPalace = vi.fn()
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
                          <PalacesPage onOpenPalace={onOpenPalace} />
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

    // Create now lives in the bottom-right speed-dial: open it, then pick "Create palace".
    await user.click(screen.getByRole('button', { name: /quick actions/i }))
    await user.click(await screen.findByRole('button', { name: /create palace/i }))
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
