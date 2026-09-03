import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createDeckStore,
  type Deck,
  DEFAULT_CARD_STYLE,
  type DeckSettings,
  DeckStoreContext,
  makeDeck,
} from '@/entities/deck'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { DeckCardStylePage } from './DeckCardStylePage'

afterEach(cleanup)

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
      <PreferencesStoreContext
        value={started(createPreferencesStore(new InMemoryRepository<Preferences>()))}
      >
        <DeckStoreContext value={started(createDeckStore(repo))}>
          <DeckCardStylePage deckId="d1" onBack={() => {}} />
        </DeckStoreContext>
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
  const style = async () => (await repo.getById('d1'))?.settings.cardStyle
  const apply = () => screen.getByRole('button', { name: 'Apply' })
  return { repo, style, apply }
}

describe('DeckCardStylePage', () => {
  it('previews a preset without saving it, and offers Apply', async () => {
    const user = userEvent.setup()
    const { style, apply } = renderPage()
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()

    await user.click(await screen.findByRole('radio', { name: 'Notebook' }))
    expect(await screen.findByRole('radio', { name: 'Notebook' })).toBeChecked()
    expect(await style()).toBeUndefined()

    await user.click(apply())
    await waitFor(async () => expect((await style())?.preset).toBe('notebook'))
  })

  it('drops the bar again once the draft matches what is saved', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('radio', { name: 'Chalk' }))
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Plain' }))
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()
  })

  it('steps the text size and clamps at the top', async () => {
    const user = userEvent.setup()
    const { style, apply } = renderPage({
      cardStyle: { ...DEFAULT_CARD_STYLE, textSize: 39 },
    })
    await user.click(await screen.findByRole('button', { name: 'Larger text' }))
    await user.click(screen.getByRole('button', { name: 'Larger text' }))
    await user.click(apply())
    await waitFor(async () => expect((await style())?.textSize).toBe(40))
  })

  it('saves an alignment', async () => {
    const user = userEvent.setup()
    const { style, apply } = renderPage()
    await user.click(await screen.findByRole('button', { name: 'Align left' }))
    await user.click(apply())
    await waitFor(async () => expect((await style())?.alignment).toBe('left'))
  })

  it('resets into the draft, so the reset itself is undoable until Apply', async () => {
    const user = userEvent.setup()
    const started = { preset: 'chalk', font: 'mono', textSize: 18, alignment: 'right' } as const
    const { style, apply } = renderPage({ cardStyle: started })

    await user.click(await screen.findByRole('button', { name: 'Reset card style' }))
    expect(await style()).toEqual(started)

    await user.click(apply())
    await waitFor(async () => expect(await style()).toEqual(DEFAULT_CARD_STYLE))
  })

  /** An enabled button that silently does nothing is worse than one that says it has nothing to do. */
  it('offers no reset when the style already is the default', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: 'Reset card style' })).toBeDisabled()
  })

  it('offers every preset, the two new scenes included', async () => {
    renderPage()
    for (const name of ['Plain', 'Outlined', 'Chalk', 'Notebook', 'Paper', 'Parchment', 'Night']) {
      expect(await screen.findByRole('radio', { name })).toBeInTheDocument()
    }
  })
})
