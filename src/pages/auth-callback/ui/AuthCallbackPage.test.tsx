import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { AuthGateway } from '@/shared/api'
import { AuthGatewayContext } from '@/shared/lib'
import { AuthCallbackPage, type AuthCallbackPageProps } from './AuthCallbackPage'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/auth/callback')
})

function renderCallback(
  props: Partial<AuthCallbackPageProps> = {},
  completeAuthRedirect = vi.fn().mockResolvedValue(undefined),
) {
  const gateway = { completeAuthRedirect } as unknown as AuthGateway
  const onDone = vi.fn()
  const onCancel = vi.fn()
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={gateway}>{children}</AuthGatewayContext>
    </I18nextProvider>
  )
  render(
    wrap(<AuthCallbackPage sessionReady={false} onDone={onDone} onCancel={onCancel} {...props} />),
  )
  return { onDone, onCancel, completeAuthRedirect }
}

describe('AuthCallbackPage', () => {
  it('shows a signing-in state while resolving the session', () => {
    renderCallback()
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument()
  })

  it('continues home as soon as a session arrives', () => {
    const { onDone } = renderCallback({ sessionReady: true })
    expect(onDone).toHaveBeenCalledWith('home')
  })

  it('sends a recovery link to the set-password screen instead', () => {
    window.history.replaceState({}, '', '/auth/callback?next=recovery')
    const { onDone } = renderCallback({ sessionReady: true })
    expect(onDone).toHaveBeenCalledWith('recovery')
  })

  it('exchanges the code through the gateway, not a Supabase import', async () => {
    window.history.replaceState({}, '', '/auth/callback?code=abc123')
    const { completeAuthRedirect } = renderCallback()
    await waitFor(() => expect(completeAuthRedirect).toHaveBeenCalledWith('abc123'))
  })

  it('does not exchange when there is no code', () => {
    const { completeAuthRedirect } = renderCallback()
    expect(completeAuthRedirect).not.toHaveBeenCalled()
  })

  it('offers a way back when the exchange fails, in the app’s own words', async () => {
    window.history.replaceState({}, '', '/auth/callback?code=abc123')
    const user = userEvent.setup()
    const { onCancel } = renderCallback({}, vi.fn().mockRejectedValue(new Error('code expired')))

    expect(await screen.findByText(/didn't work/i)).toBeInTheDocument()
    expect(screen.queryByText(/code expired/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('surfaces a provider refusal without calling the exchange', async () => {
    window.history.replaceState({}, '', '/auth/callback?error_description=access%20denied')
    const { completeAuthRedirect } = renderCallback()

    expect(await screen.findByText(/didn't work/i)).toBeInTheDocument()
    expect(completeAuthRedirect).not.toHaveBeenCalled()
  })
})
