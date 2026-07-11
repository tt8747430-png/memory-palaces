import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { createDeckStore, makeDeck, type Deck, DeckStoreContext } from '@/entities/deck'
import { CardStoreContext, createCardStore, type Card } from '@/entities/card'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { createProgressStore, type Progress, ProgressStoreContext } from '@/entities/progress'
import {
  type AppNotification,
  createNotificationStore,
  NotificationStoreContext,
} from '@/entities/notification'
import { SettingsClearPage } from './SettingsClearPage'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

function setup(
  seed: { decks?: Deck[]; progress?: Progress; notifications?: AppNotification[] } = {},
) {
  const deckRepo = new InMemoryRepository<Deck>(seed.decks ?? [])
  const deckStore = createDeckStore(deckRepo)
  const cardStore = createCardStore(new InMemoryRepository<Card>())
  const folderStore = createFolderStore(new InMemoryRepository<Folder>())
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  const progressStore = createProgressStore(
    new InMemoryRepository<Progress>(seed.progress ? [seed.progress] : []),
  )
  const notificationStore = createNotificationStore(
    new InMemoryRepository<AppNotification>(seed.notifications ?? []),
  )
  render(
    <I18nextProvider i18n={i18n}>
      <DeckStoreContext value={deckStore}>
        <CardStoreContext value={cardStore}>
          <FolderStoreContext value={folderStore}>
            <QuestionStoreContext value={questionStore}>
              <ProgressStoreContext value={progressStore}>
                <NotificationStoreContext value={notificationStore}>
                  <SettingsClearPage onBack={() => {}} />
                </NotificationStoreContext>
              </ProgressStoreContext>
            </QuestionStoreContext>
          </FolderStoreContext>
        </CardStoreContext>
      </DeckStoreContext>
    </I18nextProvider>,
  )
  return { deckRepo }
}

describe('SettingsClearPage', () => {
  it('clears all content after the confirm is accepted', async () => {
    const user = userEvent.setup()
    const { deckRepo } = setup({
      decks: [makeDeck({ id: 'd1', createdAt: at(0), name: 'Home' })],
    })

    await waitFor(async () => expect(await deckRepo.getAll()).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: /memory palaces/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^clear$/i }))

    await waitFor(async () => expect(await deckRepo.getAll()).toHaveLength(0))
  })

  it('disables reset everything when there is nothing to clear', async () => {
    setup()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reset everything/i })).toBeDisabled(),
    )
  })
})
