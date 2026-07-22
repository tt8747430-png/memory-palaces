import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { PasswordField } from './PasswordField'

afterEach(cleanup)

describe('PasswordField', () => {
  it('masks the value until the reveal control is toggled', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <PasswordField id="pw" label="Password" value="secret" onValueChange={() => {}} />,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })

  it('forwards typed input through onValueChange', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderWithProviders(
      <PasswordField id="pw" label="Password" value="" onValueChange={onValueChange} />,
    )
    await user.type(screen.getByLabelText('Password'), 'a')
    expect(onValueChange).toHaveBeenCalledWith('a')
  })
})
