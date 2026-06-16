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
import { SettingsPrivacyPage } from './SettingsPrivacyPage'

afterEach(cleanup)

function renderPage() {
  const repo = new InMemoryRepository<Preferences>()
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesStoreContext value={createPreferencesStore(repo)}>
        <SettingsPrivacyPage onBack={() => {}} />
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
  return { repo }
}

describe('SettingsPrivacyPage', () => {
  it('reflects the privacy defaults', () => {
    renderPage()
    expect(screen.getByRole('switch', { name: /profile visibility/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('switch', { name: /activity sharing/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('persists a privacy change without dropping the other flags', async () => {
    const user = userEvent.setup()
    const { repo } = renderPage()

    await user.click(screen.getByRole('switch', { name: /activity sharing/i }))

    await waitFor(async () => {
      const [prefs] = await repo.getAll()
      expect(prefs?.privacy.activitySharing).toBe(true)
      expect(prefs?.privacy.profileVisibility).toBe(true)
    })
  })
})
