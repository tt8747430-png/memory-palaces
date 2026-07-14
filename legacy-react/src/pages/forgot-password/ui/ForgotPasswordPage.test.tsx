import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { AuthGatewayContext } from '@/shared/lib'
import { LocalAuthGateway } from '@/app/persistence/local-auth-gateway'
import { ForgotPasswordPage } from './ForgotPasswordPage'

afterEach(cleanup)

function renderForgot(props: Partial<Parameters<typeof ForgotPasswordPage>[0]> = {}) {
  const gateway = new LocalAuthGateway(() => 'id-1')
  const spy = vi.spyOn(gateway, 'requestPasswordReset')
  const onBack = vi.fn()
  const wrap = (children: ReactNode) => (
    <I18nextProvider i18n={i18n}>
      <AuthGatewayContext value={gateway}>{children}</AuthGatewayContext>
    </I18nextProvider>
  )
  render(wrap(<ForgotPasswordPage onBack={onBack} {...props} />))
  return { onBack, spy }
}

describe('ForgotPasswordPage', () => {
  it('shows the unified Mindscape brand mark', () => {
    renderForgot()
    expect(screen.getByRole('img', { name: /mindscape/i })).toBeInTheDocument()
  })

  it('validates the email before sending', async () => {
    const user = userEvent.setup()
    const { spy } = renderForgot()
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })

  it('sends and shows the confirmation with a cooling-down resend', async () => {
    const user = userEvent.setup()
    const { spy } = renderForgot()
    await user.type(screen.getByLabelText(/email/i), 'ada@b.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => expect(screen.getByText(/check your inbox/i)).toBeInTheDocument())
    expect(spy).toHaveBeenCalledWith('ada@b.com')
    expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled()
  })

  it('routes back to sign in', async () => {
    const user = userEvent.setup()
    const { onBack } = renderForgot()
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
