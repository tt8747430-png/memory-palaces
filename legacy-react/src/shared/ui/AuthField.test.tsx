import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Mail } from 'lucide-react'
import { AuthField } from './AuthField'

afterEach(cleanup)

describe('AuthField', () => {
  it('associates the label with the input', () => {
    render(<AuthField id="email" label="Email" value="" onValueChange={() => {}} icon={<Mail />} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('fires onValueChange as the user types', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<AuthField id="email" label="Email" value="" onValueChange={onValueChange} />)
    await user.type(screen.getByLabelText('Email'), 'a')
    expect(onValueChange).toHaveBeenCalledWith('a')
  })

  it('shows an error and marks the input invalid', () => {
    render(
      <AuthField id="email" label="Email" value="x" onValueChange={() => {}} error="Bad email" />,
    )
    expect(screen.getByText('Bad email')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders a right slot (e.g. password toggle)', () => {
    render(
      <AuthField
        id="pw"
        label="Password"
        value=""
        onValueChange={() => {}}
        rightSlot={<button type="button">toggle</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'toggle' })).toBeInTheDocument()
  })
})
