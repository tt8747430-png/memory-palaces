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
import { LoginPage } from './LoginPage'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

function renderLogin(props: Partial<Parameters<typeof LoginPage>[0]> = {}) {
  const gateway = new LocalAuthGateway(() => 'id-1')
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={gateway}>
        <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
          <ProfileStoreContext value={createProfileStore(new InMemoryRepository<Profile>())}>
            {children}
          </ProfileStoreContext>
        </SessionStoreContext>
      </AuthGatewayContext>
    </I18nextProvider>
  )
  const onAuthed = vi.fn()
  const onGuest = vi.fn()
  const onSignup = vi.fn()
  const onForgot = vi.fn()
  render(wrap(<LoginPage onAuthed={onAuthed} onGuest={onGuest} onSignup={onSignup} onForgot={onForgot} {...props} />))
  return { gateway, onAuthed, onGuest, onSignup, onForgot }
}

describe('LoginPage', () => {
  it('shows the unified Mindscape brand mark', () => {
    renderLogin()
    expect(screen.getByRole('img', { name: /mindscape/i })).toBeInTheDocument()
  })

  it('validates before submitting and does not authenticate', async () => {
    const user = userEvent.setup()
    const { onAuthed } = renderLogin()
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument()
    expect(onAuthed).not.toHaveBeenCalled()
  })

  it('signs in with valid input and persists an account', async () => {
    const user = userEvent.setup()
    const { onAuthed, gateway } = renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'ada@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(onAuthed).toHaveBeenCalled())
    expect(gateway.getPersisted()).toMatchObject({ kind: 'account', email: 'ada@b.com' })
  })

  it('continues as guest', async () => {
    const user = userEvent.setup()
    const { onGuest, gateway } = renderLogin()
    await user.click(screen.getByRole('button', { name: /continue as a guest/i }))
    await waitFor(() => expect(onGuest).toHaveBeenCalled())
    expect(gateway.getPersisted()?.kind).toBe('guest')
  })

  it('routes to signup and forgot', async () => {
    const user = userEvent.setup()
    const { onSignup, onForgot } = renderLogin()
    await user.click(screen.getByRole('button', { name: /create an account/i }))
    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(onSignup).toHaveBeenCalled()
    expect(onForgot).toHaveBeenCalled()
  })
})
