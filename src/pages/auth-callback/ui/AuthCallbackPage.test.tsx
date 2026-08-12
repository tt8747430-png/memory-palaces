import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { AuthCallbackPage, type AuthCallbackPageProps } from './AuthCallbackPage'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/auth/callback')
})

const wrap = (children: ReactNode) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>

function renderCallback(props: Partial<AuthCallbackPageProps> = {}) {
  const onDone = vi.fn()
  const onCancel = vi.fn()
  const exchangeCode = vi.fn().mockResolvedValue({ error: null })
  render(
    wrap(
      <AuthCallbackPage
        sessionReady={false}
        onDone={onDone}
        onCancel={onCancel}
        exchangeCode={exchangeCode}
        {...props}
      />,
    ),
  )
  return { onDone, onCancel, exchangeCode }
}

describe('AuthCallbackPage', () => {
  it('shows a signing-in state while resolving the session', () => {
    renderCallback()
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument()
  })

  it('finishes as soon as a session arrives', () => {
    const { onDone } = renderCallback({ sessionReady: true })
    expect(onDone).toHaveBeenCalled()
  })

  it('exchanges the PKCE code when one is in the URL', async () => {
    window.history.replaceState({}, '', '/auth/callback?code=abc123')
    const { exchangeCode } = renderCallback()
    await waitFor(() => expect(exchangeCode).toHaveBeenCalledWith('abc123'))
  })

  it('does not exchange when there is no code', () => {
    const { exchangeCode } = renderCallback()
    expect(exchangeCode).not.toHaveBeenCalled()
  })

  it('surfaces a failed exchange with a way back', async () => {
    window.history.replaceState({}, '', '/auth/callback?code=abc123')
    const user = userEvent.setup()
    const { onCancel } = renderCallback({
      exchangeCode: vi.fn().mockResolvedValue({ error: { message: 'code expired' } }),
    })

    expect(await screen.findByText(/code expired/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('surfaces a provider-side refusal without calling the exchange', async () => {
    window.history.replaceState({}, '', '/auth/callback?error_description=access%20denied')
    const { exchangeCode } = renderCallback()

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument()
    expect(exchangeCode).not.toHaveBeenCalled()
  })
})
