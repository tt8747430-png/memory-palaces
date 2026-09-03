import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository, LocalObjectUrlStorage } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import {
  createDeckStore,
  type Deck,
  type DeckSettings,
  DeckStoreContext,
  makeDeck,
} from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import { StoragePortContext } from '@/shared/lib'
import { DeckSettingsPage, type DeckSettingsPageProps } from './DeckSettingsPage'

afterEach(cleanup)

function renderPage(
  settings: Partial<DeckSettings> = {},
  props: Partial<DeckSettingsPageProps> = {},
) {
  const deck = makeDeck({
    id: 'd1',
    createdAt: new Date(0).toISOString(),
    name: 'Physics',
    settings,
  })
  const repo = new InMemoryRepository<Deck>([deck])
  render(
    <I18nextProvider i18n={i18n}>
      <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
        <StoragePortContext value={new LocalObjectUrlStorage()}>
          <FolderStoreContext value={started(createFolderStore(new InMemoryRepository<Folder>()))}>
            <CardStoreContext value={started(createCardStore(new InMemoryRepository<Card>()))}>
              <DeckStoreContext value={started(createDeckStore(repo))}>
                <DeckSettingsPage deckId="d1" onBack={() => {}} {...props} />
              </DeckStoreContext>
            </CardStoreContext>
          </FolderStoreContext>
        </StoragePortContext>
      </SessionStoreContext>
    </I18nextProvider>,
  )
  return { repo }
}

describe('DeckSettingsPage', () => {
  it("leads with the deck's algorithm", async () => {
    renderPage({ algorithm: 'fast' })
    const row = await screen.findByRole('button', { name: /Fast review/ })
    expect(within(row).getByText('Algorithm preset')).toBeInTheDocument()
  })

  it('offers the settings groups and nothing excluded', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: /Card style/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Text-to-speech/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Import cards/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rename deck/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Move deck/ })).toBeInTheDocument()
    for (const gone of [
      'AI cards generation',
      'Publish in library',
      'Sharing settings',
      'Report deck',
      'Offline learning',
    ]) {
      expect(screen.queryByText(gone)).toBeNull()
    }
  })

  it('navigates to each sub-page', async () => {
    const user = userEvent.setup()
    const onOpenAlgorithm = vi.fn()
    const onOpenCardStyle = vi.fn()
    const onOpenTts = vi.fn()
    renderPage({}, { onOpenAlgorithm, onOpenCardStyle, onOpenTts })

    await user.click(await screen.findByRole('button', { name: /Fast review|Spaced repetition/ }))
    expect(onOpenAlgorithm).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Card style/ }))
    expect(onOpenCardStyle).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Text-to-speech/ }))
    expect(onOpenTts).toHaveBeenCalled()
  })

  /**
   * The row used to navigate straight to the review screen, which renders nothing without a draft
   * and bounced the learner back out. It opens the two import doors instead.
   */
  it('opens the import sheet rather than an empty review screen', async () => {
    const user = userEvent.setup()
    const onPasteNotes = vi.fn()
    const onReviewImport = vi.fn()
    renderPage({}, { onPasteNotes, onReviewImport })

    await user.click(await screen.findByRole('button', { name: /Import cards/ }))
    expect(onReviewImport).not.toHaveBeenCalled()

    await user.click(await screen.findByRole('button', { name: /Paste notes/ }))
    expect(onPasteNotes).toHaveBeenCalled()
  })

  it('asks before duplicating', async () => {
    const user = userEvent.setup()
    const { repo } = renderPage()

    await user.click(await screen.findByRole('button', { name: /Duplicate deck/ }))
    expect(await repo.getAll()).toHaveLength(1)

    await user.click(await screen.findByRole('button', { name: /^Duplicate$/ }))
    await waitFor(async () => expect(await repo.getAll()).toHaveLength(2))
  })

  it('asks before archiving, then leaves the deck behind', async () => {
    const user = userEvent.setup()
    const onArchived = vi.fn()
    const { repo } = renderPage({}, { onArchived })

    await user.click(await screen.findByRole('button', { name: /Archive deck/ }))
    expect((await repo.getById('d1'))?.archived).toBe(false)
    expect(onArchived).not.toHaveBeenCalled()

    await user.click(await screen.findByRole('button', { name: /^Archive deck$/ }))
    await waitFor(async () => expect((await repo.getById('d1'))?.archived).toBe(true))
    expect(onArchived).toHaveBeenCalled()
  })
})
