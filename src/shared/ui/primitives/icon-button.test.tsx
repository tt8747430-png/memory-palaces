import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { IconButton } from './icon-button'

afterEach(cleanup)

describe('IconButton', () => {
  it('exposes its aria-label as the accessible name and fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <IconButton aria-label="Close" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(<IconButton aria-label="Close" disabled onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies the requested variant and size', () => {
    renderWithProviders(<IconButton aria-label="Close" variant="solid" size="sm" />)
    const button = screen.getByRole('button', { name: 'Close' })
    expect(button.className).toContain('bg-primary')
    expect(button.className).toContain('size-9')
  })
})
