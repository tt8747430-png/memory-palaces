import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

afterEach(cleanup)

describe('Switch', () => {
  it('reflects the checked state and toggles on click', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Sound" />)

    const control = screen.getByRole('switch', { name: 'Sound' })
    expect(control).toHaveAttribute('aria-checked', 'false')

    await user.click(control)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
