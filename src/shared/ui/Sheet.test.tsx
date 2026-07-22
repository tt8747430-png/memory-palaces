import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Sheet } from './Sheet'

afterEach(cleanup)

describe('Sheet', () => {
  it('renders its title, description and children in a portal when open', async () => {
    renderWithProviders(
      <Sheet open onOpenChange={() => {}} title="Deck settings" description="Tune the deck">
        <p>Body content</p>
      </Sheet>,
    )
    expect(await screen.findByText('Deck settings')).toBeInTheDocument()
    expect(screen.getByText('Tune the deck')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('requests close from the close control', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(
      <Sheet open onOpenChange={onOpenChange} title="Deck settings">
        <p>Body content</p>
      </Sheet>,
    )
    await user.click(await screen.findByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders a footer slot', async () => {
    renderWithProviders(
      <Sheet
        open
        onOpenChange={() => {}}
        title="Deck settings"
        footer={<button type="button">Save</button>}
      >
        <p>Body content</p>
      </Sheet>,
    )
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument()
  })
})
