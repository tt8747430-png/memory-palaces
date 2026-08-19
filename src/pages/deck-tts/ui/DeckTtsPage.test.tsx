import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import * as lib from '@/shared/lib'
import {
  createDeckStore,
  type Deck,
  type DeckSettings,
  DeckStoreContext,
  makeDeck,
} from '@/entities/deck'
import { DeckTtsPage } from './DeckTtsPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** jsdom has no speech synthesis, so every case states the device it is testing against. */
function withVoices(available: boolean) {
  vi.spyOn(lib, 'speechAvailable').mockReturnValue(available)
}

function renderPage(settings: Partial<DeckSettings> = {}) {
  const deck = makeDeck({
    id: 'd1',
    createdAt: new Date(0).toISOString(),
    name: 'Physics',
    settings,
  })
  const repo = new InMemoryRepository<Deck>([deck])
  render(
    <I18nextProvider i18n={i18n}>
      <DeckStoreContext value={started(createDeckStore(repo))}>
        <DeckTtsPage deckId="d1" onBack={() => {}} />
      </DeckStoreContext>
    </I18nextProvider>,
  )
  const saved = async () => (await repo.getById('d1'))?.settings
  return { repo, saved }
}

describe('DeckTtsPage', () => {
  it('saves the master switch', async () => {
    const user = userEvent.setup()
    withVoices(true)
    const { saved } = renderPage({ textToSpeech: false })
    await user.click(await screen.findByRole('switch', { name: 'Read cards aloud' }))
    await waitFor(async () => expect((await saved())?.textToSpeech).toBe(true))
  })

  it('saves which side is read', async () => {
    const user = userEvent.setup()
    withVoices(true)
    const { saved } = renderPage({ textToSpeech: true })
    await user.click(await screen.findByRole('button', { name: 'Front only' }))
    await waitFor(async () => expect((await saved())?.tts?.side).toBe('front'))
  })

  it('explains itself when the device has no voices', async () => {
    withVoices(false)
    renderPage({ textToSpeech: true })
    expect(await screen.findByText('This device has no speech voices')).toBeInTheDocument()
  })
})
