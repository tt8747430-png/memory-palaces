import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  createProfileStore,
  makeProfile,
  ProfileStoreContext,
  type Profile,
} from '@/entities/profile'
import { SettingsProfilePage } from './SettingsProfilePage'

afterEach(cleanup)

function renderPage(seed?: Profile, onBack: () => void = () => {}) {
  const repo = new InMemoryRepository<Profile>(seed ? [seed] : [])
  render(
    <I18nextProvider i18n={i18n}>
      <ProfileStoreContext value={createProfileStore(repo)}>
        <SettingsProfilePage onBack={onBack} />
      </ProfileStoreContext>
    </I18nextProvider>,
  )
  return { repo }
}

const seeded = makeProfile({ id: 'profile', createdAt: new Date(0).toISOString(), name: 'Ada', email: 'ada@x.io' })

describe('SettingsProfilePage', () => {
  it('hydrates the fields from the stored profile', async () => {
    renderPage(seeded)
    expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ada@x.io')).toBeInTheDocument()
  })

  it('disables save for an invalid email', async () => {
    const user = userEvent.setup()
    renderPage(seeded)
    const email = await screen.findByDisplayValue('ada@x.io')

    await user.clear(email)
    await user.type(email, 'not-an-email')

    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('saves edits through the profile store and returns', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { repo } = renderPage(seeded, onBack)
    const name = await screen.findByDisplayValue('Ada')

    await user.clear(name)
    await user.type(name, 'Grace Hopper')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(async () => {
      const [profile] = await repo.getAll()
      expect(profile?.name).toBe('Grace Hopper')
    })
    expect(onBack).toHaveBeenCalled()
  })
})
