import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ConfirmDialog } from './ConfirmDialog'

afterEach(cleanup)

function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  renderWithProviders(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Delete deck?"
      description="This cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      {...overrides}
    />,
  )
  return { onConfirm, onOpenChange }
}

describe('ConfirmDialog', () => {
  it('renders the title and description when open', async () => {
    setup()
    expect(await screen.findByText('Delete deck?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('confirms and closes from the confirm button', async () => {
    const user = userEvent.setup()
    const { onConfirm, onOpenChange } = setup()
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('requests close from the cancel control without confirming', async () => {
    const user = userEvent.setup()
    const { onConfirm, onOpenChange } = setup()
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('gives the confirm button a destructive surface when flagged', async () => {
    setup({ destructive: true })
    expect((await screen.findByRole('button', { name: 'Delete' })).className).toContain('danger')
  })
})
