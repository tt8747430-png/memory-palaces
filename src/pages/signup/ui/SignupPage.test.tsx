import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { AuthGatewayContext } from '@/shared/lib'
import { createSessionStore, SessionStoreContext, type Session } from '@/entities/session'
import { createProfileStore, ProfileStoreContext, type Profile } from '@/entities/profile'
import { LocalAuthGateway } from '@/app/persistence/local-auth-gateway'
import { SignupPage } from './SignupPage'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

function renderSignup(props: Partial<Parameters<typeof SignupPage>[0]> = {}) {
  const gateway = new LocalAuthGateway(() => 'id-1')
  const profileRepo = new InMemoryRepository<Profile>()
  const profileStore = createProfileStore(profileRepo)
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={gateway}>
        <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
          <ProfileStoreContext value={profileStore}>{children}</ProfileStoreContext>
        </SessionStoreContext>
      </AuthGatewayContext>
    </I18nextProvider>
  )
  const onSuccess = vi.fn()
  const onGuest = vi.fn()
  const onLogin = vi.fn()
  render(wrap(<SignupPage onSuccess={onSuccess} onGuest={onGuest} onLogin={onLogin} {...props} />))
  return { gateway, profileRepo, onSuccess, onGuest, onLogin }
}

describe('SignupPage', () => {
  it('shows the unified Mindscape brand mark', () => {
    renderSignup()
    expect(screen.getByRole('img', { name: /mindscape/i })).toBeInTheDocument()
  })

  it('blocks submit until the form is valid', async () => {
    const user = userEvent.setup()
    const { onSuccess } = renderSignup()
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/enter your name/i)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('requires accepting the terms', async () => {
    const user = userEvent.setup()
    const { onSuccess } = renderSignup()
    await user.type(screen.getByLabelText(/full name/i), 'Ada')
    await user.type(screen.getByLabelText(/email/i), 'ada@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/accept the terms/i)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('creates an account, seeds the profile, and proceeds to welcome', async () => {
    const user = userEvent.setup()
    const { onSuccess, gateway, profileRepo } = renderSignup()
    await user.type(screen.getByLabelText(/full name/i), 'Ada')
    await user.type(screen.getByLabelText(/email/i), 'ada@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(gateway.getPersisted()).toMatchObject({
      kind: 'account',
      name: 'Ada',
      email: 'ada@b.com',
    })
    expect(await profileRepo.getAll()).toEqual([
      expect.objectContaining({ name: 'Ada', email: 'ada@b.com' }),
    ])
  })

  it('continues as guest and routes to login', async () => {
    const user = userEvent.setup()
    const { onGuest, onLogin } = renderSignup()
    await user.click(screen.getByRole('button', { name: /continue as a guest/i }))
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(onGuest).toHaveBeenCalled()
    expect(onLogin).toHaveBeenCalled()
  })
})
