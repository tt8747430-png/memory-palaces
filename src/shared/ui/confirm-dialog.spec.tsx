import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverlayHost } from './overlay-host'
import { openConfirmDialog } from './confirm-dialog'

describe('openConfirmDialog', () => {
  it('resolves true when the confirm action is clicked', async () => {
    render(<OverlayHost />)
    const promise = openConfirmDialog({ title: 'Delete?', confirmLabel: 'Delete' })

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    await expect(promise).resolves.toBe(true)
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
  })

  it('resolves false when cancel is clicked', async () => {
    render(<OverlayHost />)
    const promise = openConfirmDialog({ title: 'Delete?' })

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    await expect(promise).resolves.toBe(false)
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
  })

  it('resolves false on Escape dismiss', async () => {
    render(<OverlayHost />)
    const promise = openConfirmDialog({ title: 'Delete?' })

    await screen.findByText('Delete?')
    await userEvent.keyboard('{Escape}')

    await expect(promise).resolves.toBe(false)
  })
})
