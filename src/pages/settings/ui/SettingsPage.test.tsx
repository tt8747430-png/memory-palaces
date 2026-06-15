import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createPreferencesStore,
  PreferencesStoreContext,
  type Preferences,
} from '@/entities/preferences'
import { SettingsPage } from './SettingsPage'

afterEach(cleanup)

function renderSettings() {
  const prefsRepo = new InMemoryRepository<Preferences>()
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesStoreContext value={createPreferencesStore(prefsRepo)}>
        <SettingsPage onBack={() => {}} />
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
  return { prefsRepo }
}

describe('SettingsPage', () => {
  it('shows the preference toggles defaulting to on', () => {
    renderSettings()
    expect(screen.getByRole('switch', { name: /sound effects/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('switch', { name: /reduced motion/i })).toBeInTheDocument()
  })

  it('toggles a preference and persists it', async () => {
    const user = userEvent.setup()
    const { prefsRepo } = renderSettings()

    const haptics = screen.getByRole('switch', { name: /haptics/i })
    expect(haptics).toHaveAttribute('aria-checked', 'true')

    await user.click(haptics)
    expect(haptics).toHaveAttribute('aria-checked', 'false')

    await waitFor(async () => {
      const [prefs] = await prefsRepo.getAll()
      expect(prefs?.haptics).toBe(false)
    })
  })
})
