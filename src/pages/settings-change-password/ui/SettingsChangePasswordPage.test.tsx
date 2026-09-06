import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { AuthError, InMemoryRepository, type AuthGateway } from '@/shared/api'
import { AuthGatewayContext } from '@/shared/lib'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import {
  createProfileStore,
  makeProfile,
  type Profile,
  ProfileStoreContext,
} from '@/entities/profile'
import { started } from '@/shared/test/started'
import { SettingsChangePasswordPage } from './SettingsChangePasswordPage'

afterEach(cleanup)

const ACCOUNT_EMAIL = 'ada@example.com'

function renderPage(
  props: { recovery?: boolean } = {},
  updatePassword = vi.fn().mockResolvedValue(undefined),
  signIn = vi.fn().mockResolvedValue({ id: 'u1', kind: 'account', email: ACCOUNT_EMAIL }),
) {
  const gateway = { updatePassword, signIn } as unknown as AuthGateway
  const profileRepo = new InMemoryRepository<Profile>([
    makeProfile({ id: 'profile', createdAt: new Date(0).toISOString(), email: ACCOUNT_EMAIL }),
  ])
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={gateway}>
        <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
          <ProfileStoreContext value={started(createProfileStore(profileRepo))}>
            {children}
          </ProfileStoreContext>
        </SessionStoreContext>
      </AuthGatewayContext>
    </I18nextProvider>
  )
  render(wrap(<SettingsChangePasswordPage onBack={() => {}} {...props} />))
  return { updatePassword, signIn }
}

describe('SettingsChangePasswordPage', () => {
  it('keeps save disabled until every field is valid', async () => {
    const user = userEvent.setup()
    renderPage()
    const submit = screen.getByRole('button', { name: /update password/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/current password/i), 'oldsecret1')
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')

    expect(submit).toBeEnabled()
  })

  it('shows a mismatch hint and blocks save', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/current password/i), 'oldsecret1')
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'different1')

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled()
  })

  it('verifies the current password, then sets the new one through the gateway', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    const { updatePassword, signIn } = renderPage()

    await user.type(screen.getByLabelText(/current password/i), 'oldsecret1')
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('secret123'))
    expect(signIn).toHaveBeenCalledWith({ email: ACCOUNT_EMAIL, password: 'oldsecret1' })
    expect(success).toHaveBeenCalled()
  })

  it('refuses the change when the current password is wrong', async () => {
    const user = userEvent.setup()
    const error = vi.spyOn(toast, 'error')
    const { updatePassword } = renderPage(
      {},
      vi.fn().mockResolvedValue(undefined),
      vi.fn().mockRejectedValue(new AuthError('Invalid login credentials', 'invalid_credentials')),
    )

    await user.type(screen.getByLabelText(/current password/i), 'not-my-password')
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(error).toHaveBeenCalled())
    // The field is a check, not a decoration: a wrong answer must not reach `updatePassword`.
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('reports a refused change instead of claiming success', async () => {
    const user = userEvent.setup()
    const error = vi.spyOn(toast, 'error')
    renderPage({}, vi.fn().mockRejectedValue(new Error('too weak')))

    await user.type(screen.getByLabelText(/current password/i), 'oldsecret1')
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(error).toHaveBeenCalled())
  })

  it('asks for no current password after a recovery link, and challenges nothing', async () => {
    const user = userEvent.setup()
    const { updatePassword, signIn } = renderPage({ recovery: true })

    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('secret123'))
    // The link already proved they own the address, and they are here because they forgot it.
    expect(signIn).not.toHaveBeenCalled()
  })
})
