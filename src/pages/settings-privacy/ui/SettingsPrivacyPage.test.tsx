import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { SettingsPrivacyPage } from './SettingsPrivacyPage'

afterEach(cleanup)

function renderPage() {
  const repo = new InMemoryRepository<Preferences>()
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesStoreContext value={started(createPreferencesStore(repo))}>
        <SettingsPrivacyPage onBack={() => {}} />
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
  return { repo }
}

describe('SettingsPrivacyPage', () => {
  it('lists every privacy control', () => {
    renderPage()
    for (const label of [
      /profile visibility/i,
      /activity sharing/i,
      /location access/i,
      /notification insights/i,
      /data encryption/i,
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('offers no switch, because nothing reads what a switch would write', () => {
    renderPage()
    // A control that changes nothing must not look like one that does — "Data encryption"
    // used to render already on, over an unencrypted IndexedDB store.
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
    expect(screen.getByRole('button', { name: /data encryption/i })).toBeDisabled()
  })

  it('writes nothing when a row is pressed', async () => {
    const { repo } = renderPage()
    screen.getByRole('button', { name: /activity sharing/i }).click()
    await expect(repo.getAll()).resolves.toHaveLength(0)
  })
})
