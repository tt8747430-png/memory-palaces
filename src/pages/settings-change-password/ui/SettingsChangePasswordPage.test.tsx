import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { SettingsChangePasswordPage } from './SettingsChangePasswordPage'

afterEach(cleanup)

function renderPage() {
  render(
    <I18nextProvider i18n={i18n}>
      <SettingsChangePasswordPage onBack={() => {}} />
    </I18nextProvider>,
  )
}

describe('SettingsChangePasswordPage', () => {
  it('rejects mismatched passwords', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    renderPage()
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'different1')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument()
    expect(success).not.toHaveBeenCalled()
  })

  it('reports success on a valid (mock) change', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    renderPage()
    await user.type(screen.getByLabelText(/^new password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm new password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(success).toHaveBeenCalled()
  })
})
