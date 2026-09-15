import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createDeckStore,
  type Deck,
  DeckStoreContext,
  type DeckSettings,
  makeDeck,
} from '@/entities/deck'
import { DeckAlgorithmPage } from './DeckAlgorithmPage'

afterEach(cleanup)

function renderPage(
  settings: Partial<DeckSettings> = {},
  mainDeck?: Partial<DeckSettings>,
  deckId = 'd1',
) {
  const main = mainDeck
    ? [
        makeDeck({
          id: 'm1',
          createdAt: new Date(0).toISOString(),
          name: 'Science',
          settings: mainDeck,
        }),
      ]
    : []
  const deck = makeDeck({
    id: 'd1',
    createdAt: new Date(0).toISOString(),
    name: 'Physics',
    parentId: mainDeck ? 'm1' : null,
    settings,
  })
  const repo = new InMemoryRepository<Deck>([...main, deck])
  const onOpenAdvanced = vi.fn()
  const onOpenMainDeck = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <DeckStoreContext value={started(createDeckStore(repo))}>
        <DeckAlgorithmPage
          deckId={deckId}
          onBack={() => {}}
          onOpenAdvanced={onOpenAdvanced}
          onOpenMainDeck={onOpenMainDeck}
        />
      </DeckStoreContext>
    </I18nextProvider>,
  )
  const saved = async () => (await repo.getById('d1'))?.settings
  return { repo, saved, onOpenAdvanced, onOpenMainDeck }
}

describe('DeckAlgorithmPage', () => {
  it('offers a subdeck no controls, only the way to its main deck', async () => {
    const user = userEvent.setup()
    const { onOpenMainDeck } = renderPage({}, { algorithm: 'fast' })

    expect(await screen.findByText('Set on the main deck')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Open Science' }))
    expect(onOpenMainDeck).toHaveBeenCalledWith('m1')
  })

  it('says the deck is gone when the id no longer names one', async () => {
    renderPage({}, undefined, 'deleted')

    expect(await screen.findByText('Deck not found')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('shows only shuffle under fast review', async () => {
    renderPage({ algorithm: 'fast' })
    expect(await screen.findByRole('switch', { name: 'Shuffle cards' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /New cards per day/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Advanced settings' })).toBeNull()
  })

  it('shows the daily limits and advanced under spaced repetition', async () => {
    renderPage({ algorithm: 'spaced' })
    expect(await screen.findByRole('button', { name: /New cards per day/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Max cards per day/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Advanced settings' })).toBeInTheDocument()
  })

  it('saves a new algorithm to the deck', async () => {
    const user = userEvent.setup()
    const { saved } = renderPage({ algorithm: 'fast' })
    await user.click(await screen.findByRole('button', { name: /Fast review/ }))
    await user.click(await screen.findByRole('radio', { name: /General spaced repetition/ }))
    await waitFor(async () => expect((await saved())?.algorithm).toBe('spaced'))
  })

  it('saves a new daily limit', async () => {
    const user = userEvent.setup()
    const { saved } = renderPage({ algorithm: 'spaced' })
    await user.click(await screen.findByRole('button', { name: /New cards per day/ }))
    const field = await screen.findByRole('textbox', { name: 'New cards per day' })
    await user.clear(field)
    await user.type(field, '25')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await saved())?.newCardsPerDay).toBe(25))
  })
})
