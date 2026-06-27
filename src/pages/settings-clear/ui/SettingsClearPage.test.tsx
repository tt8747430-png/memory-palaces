import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, PalaceStoreContext, type Palace } from '@/entities/palace'
import { createRoomStore, RoomStoreContext, type Room } from '@/entities/room'
import { createLocusStore, LocusStoreContext, type Locus } from '@/entities/locus'
import { createQuestionStore, QuestionStoreContext, type Question } from '@/entities/question'
import { createProgressStore, ProgressStoreContext, type Progress } from '@/entities/progress'
import {
  createNotificationStore,
  NotificationStoreContext,
  type AppNotification,
} from '@/entities/notification'
import { SettingsClearPage } from './SettingsClearPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function setup(
  seed: { palaces?: Palace[]; progress?: Progress; notifications?: AppNotification[] } = {},
) {
  const palaceRepo = new InMemoryRepository<Palace>(seed.palaces ?? [])
  const palaceStore = createPalaceStore(palaceRepo)
  const roomStore = createRoomStore(new InMemoryRepository<Room>())
  const locusStore = createLocusStore(new InMemoryRepository<Locus>())
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  const progressStore = createProgressStore(
    new InMemoryRepository<Progress>(seed.progress ? [seed.progress] : []),
  )
  const notificationStore = createNotificationStore(
    new InMemoryRepository<AppNotification>(seed.notifications ?? []),
  )
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceStoreContext value={palaceStore}>
        <RoomStoreContext value={roomStore}>
          <LocusStoreContext value={locusStore}>
            <QuestionStoreContext value={questionStore}>
              <ProgressStoreContext value={progressStore}>
                <NotificationStoreContext value={notificationStore}>
                  <SettingsClearPage onBack={() => {}} />
                </NotificationStoreContext>
              </ProgressStoreContext>
            </QuestionStoreContext>
          </LocusStoreContext>
        </RoomStoreContext>
      </PalaceStoreContext>
    </I18nextProvider>,
  )
  return { palaceRepo }
}

describe('SettingsClearPage', () => {
  it('clears all content after the confirm is accepted', async () => {
    const user = userEvent.setup()
    const { palaceRepo } = setup({
      palaces: [makePalace({ id: 'p1', createdAt: at(0), name: 'Home' })],
    })

    await waitFor(async () => expect(await palaceRepo.getAll()).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: /memory palaces/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^clear$/i }))

    await waitFor(async () => expect(await palaceRepo.getAll()).toHaveLength(0))
  })

  it('disables reset everything when there is nothing to clear', async () => {
    setup()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reset everything/i })).toBeDisabled(),
    )
  })
})
