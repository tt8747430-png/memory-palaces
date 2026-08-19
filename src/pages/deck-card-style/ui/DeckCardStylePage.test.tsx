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
  return { repo, style }
}

describe('DeckCardStylePage', () => {
  it('saves a preset', async () => {
    const user = userEvent.setup()
    const { style } = renderPage()
    await user.click(await screen.findByRole('radio', { name: 'Notebook' }))
    await waitFor(async () => expect((await style())?.preset).toBe('notebook'))
  })

  it('steps the text size and clamps at the top', async () => {
    const user = userEvent.setup()
    const { style } = renderPage({ cardStyle: { ...DEFAULT_CARD_STYLE, textSize: 39 } })
    await user.click(await screen.findByRole('button', { name: 'Larger text' }))
    await waitFor(async () => expect((await style())?.textSize).toBe(40))
    await user.click(screen.getByRole('button', { name: 'Larger text' }))
    await waitFor(async () => expect((await style())?.textSize).toBe(40))
  })

  it('saves an alignment', async () => {
    const user = userEvent.setup()
    const { style } = renderPage()
    await user.click(await screen.findByRole('button', { name: 'Align left' }))
    await waitFor(async () => expect((await style())?.alignment).toBe('left'))
  })

  it('resets the style', async () => {
    const user = userEvent.setup()
    const { style } = renderPage({
      cardStyle: { preset: 'chalk', font: 'mono', textSize: 18, alignment: 'right' },
    })
    await user.click(await screen.findByRole('button', { name: 'Reset card style' }))
    await waitFor(async () => expect(await style()).toEqual(DEFAULT_CARD_STYLE))
  })
})
