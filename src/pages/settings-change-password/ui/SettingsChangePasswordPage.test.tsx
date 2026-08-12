import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository, type AuthGateway } from '@/shared/api'
import { AuthGatewayContext } from '@/shared/lib'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import { createProfileStore, type Profile, ProfileStoreContext } from '@/entities/profile'
import { SettingsChangePasswordPage } from './SettingsChangePasswordPage'

afterEach(cleanup)

function renderPage(
  props: { recovery?: boolean } = {},
  updatePassword = vi.fn().mockResolvedValue(undefined),
) {
  const gateway = { updatePassword } as unknown as AuthGateway
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
  render(wrap(<SettingsChangePasswordPage onBack={() => {}} {...props} />))
  return { updatePassword }
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

  it('actually sets the password through the gateway', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    const { updatePassword } = renderPage()

    await user.type(screen.getByLabelText(/current password/i), 'oldsecret1')
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('secret123'))
    expect(success).toHaveBeenCalled()
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

  it('asks for no current password after a recovery link', async () => {
    const user = userEvent.setup()
    const { updatePassword } = renderPage({ recovery: true })

    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('secret123'))
  })
})
