import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { createProfileStore, type Profile, ProfileStoreContext } from '@/entities/profile'
import { SettingsPage, type SettingsPageProps } from './SettingsPage'

afterEach(cleanup)

function renderSettings(props: Partial<SettingsPageProps> = {}) {
  const prefsRepo = new InMemoryRepository<Preferences>()
  const profileRepo = new InMemoryRepository<Profile>()
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesStoreContext value={createPreferencesStore(prefsRepo)}>
        <ProfileStoreContext value={createProfileStore(profileRepo)}>
          <SettingsPage onBack={() => {}} {...props} />
        </ProfileStoreContext>
      </PreferencesStoreContext>
    </I18nextProvider>,
  )
  return { prefsRepo, profileRepo }
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

  it('persists the appearance theme chosen from the picker', async () => {
    const user = userEvent.setup()
    const { prefsRepo } = renderSettings()

    // Appearance is an inline combobox row: open it, then pick Dark.
    await user.click(screen.getByRole('button', { name: 'Appearance' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Dark' }))

    await waitFor(async () => {
      const [prefs] = await prefsRepo.getAll()
      expect(prefs?.theme).toBe('dark')
    })
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

  it('opens the Profile screen from the profile card', async () => {
    const user = userEvent.setup()
    const onEditProfile = vi.fn()
    renderSettings({ onEditProfile })
    await user.click(screen.getByRole('button', { name: /set up your profile/i }))
    expect(onEditProfile).toHaveBeenCalledOnce()
  })

  it('navigates to privacy when the privacy row is tapped', async () => {
    const user = userEvent.setup()
    const onPrivacy = vi.fn()
    renderSettings({ onPrivacy })

    await user.click(screen.getByRole('button', { name: /privacy settings/i }))
    expect(onPrivacy).toHaveBeenCalledOnce()
  })

  it('shows log out for a signed-in account, but not account-editing rows (those live on Profile)', () => {
    renderSettings({ sessionKind: 'account', onLogout: vi.fn() })
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /change password/i })).not.toBeInTheDocument()
  })

  it('persists the chosen language from the picker', async () => {
    const user = userEvent.setup()
    const { prefsRepo } = renderSettings()

    await user.click(screen.getByRole('button', { name: /language/i }))
    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: /english/i }))

    await waitFor(async () => {
      const [prefs] = await prefsRepo.getAll()
      expect(prefs?.language).toBe('en')
    })
  })

  it('logs out only after the confirmation is accepted', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    renderSettings({ sessionKind: 'account', onLogout })

    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(onLogout).not.toHaveBeenCalled()

    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: /log out/i }))
    expect(onLogout).toHaveBeenCalled()
  })

  it('shows a sign-in CTA for guests instead of log out', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()
    renderSettings({ sessionKind: 'guest', onSignIn })

    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /sign in or create an account/i }))
    expect(onSignIn).toHaveBeenCalledOnce()
  })
})
