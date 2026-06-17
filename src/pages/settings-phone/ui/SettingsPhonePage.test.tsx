import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { SettingsPhonePage } from './SettingsPhonePage'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

function renderPage() {
  render(
    <I18nextProvider i18n={i18n}>
      <SettingsPhonePage onBack={() => {}} />
    </I18nextProvider>,
  )
}

describe('SettingsPhonePage', () => {
  it('rejects an invalid number', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    renderPage()
    await user.type(screen.getByLabelText(/phone number/i), '12')
    await user.click(screen.getByRole('button', { name: /save phone number/i }))
    expect(await screen.findByText(/valid phone/i)).toBeInTheDocument()
    expect(success).not.toHaveBeenCalled()
  })

  it('saves a valid number on the device', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    renderPage()
    await user.type(screen.getByLabelText(/phone number/i), '+1 555 000 0000')
    await user.click(screen.getByRole('button', { name: /save phone number/i }))
    expect(success).toHaveBeenCalled()
    expect(localStorage.getItem('mindscape:phone')).toBe('+1 555 000 0000')
  })
})
