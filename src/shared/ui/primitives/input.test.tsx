import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Input } from './input'

afterEach(cleanup)

describe('Input', () => {
  it('fires onChange as the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<Input aria-label="Name" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada')
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada')
  })

  it('defaults to type="text" and forwards placeholder', () => {
    renderWithProviders(<Input aria-label="Name" placeholder="Your name" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('placeholder', 'Your name')
  })

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<Input aria-label="Name" disabled onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reflects the invalid state', () => {
    renderWithProviders(<Input aria-label="Name" aria-invalid />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true')
  })
})
