import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
import { SettingsClearDataPage } from './SettingsClearDataPage'

afterEach(cleanup)

function renderPage() {
  const palaceRepo = new InMemoryRepository<Palace>([
    makePalace({ id: 'p1', createdAt: new Date(0).toISOString(), name: 'Home' }),
  ])
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceStoreContext value={createPalaceStore(palaceRepo)}>
        <RoomStoreContext value={createRoomStore(new InMemoryRepository<Room>())}>
          <LocusStoreContext value={createLocusStore(new InMemoryRepository<Locus>())}>
            <QuestionStoreContext value={createQuestionStore(new InMemoryRepository<Question>())}>
              <ProgressStoreContext value={createProgressStore(new InMemoryRepository<Progress>())}>
                <NotificationStoreContext
                  value={createNotificationStore(new InMemoryRepository<AppNotification>())}
                >
                  <SettingsClearDataPage onBack={() => {}} />
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

describe('SettingsClearDataPage', () => {
  it('clears palaces only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    const { palaceRepo } = renderPage()

    await user.click(screen.getByRole('button', { name: /memory palaces/i }))
    expect(await palaceRepo.getAll()).toHaveLength(1)

    await user.click(await screen.findByRole('button', { name: /^clear$/i }))

    await waitFor(async () => {
      expect(await palaceRepo.getAll()).toEqual([])
    })
  })

  it('shows live counts on the rows', async () => {
    renderPage()
    expect(await screen.findByText('1 palace')).toBeInTheDocument()
    expect(screen.getByText('0 notifications')).toBeInTheDocument()
  })
})
