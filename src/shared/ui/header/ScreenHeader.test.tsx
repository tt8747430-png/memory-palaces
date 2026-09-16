import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ScreenHeader } from './ScreenHeader'

afterEach(cleanup)

describe('ScreenHeader', () => {
  it('renders the title and optional subtitle', () => {
    renderWithProviders(<ScreenHeader title="Settings" subtitle="Manage your account" />)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Manage your account')).toBeInTheDocument()
  })

  it('does not render a back button without onBack', () => {
    renderWithProviders(<ScreenHeader title="Settings" />)
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
  })

  it('fires onBack from the back control', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderWithProviders(<ScreenHeader title="Settings" onBack={onBack} backLabel="Go back" />)
    await user.click(screen.getByRole('button', { name: 'Go back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('renders an action slot', () => {
    renderWithProviders(
      <ScreenHeader title="Settings" action={<button type="button">Edit</button>} />,
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  /**
   * jsdom parses `inert` but implements none of its semantics, so these assert
   * the attribute reaches the wrapper — the browser is what makes that mean
   * "out of hit-testing and out of the accessibility tree". The bar's own
   * device check is `/dev/kitchen-sink` → Keyboard & viewport.
   */
  describe('search takes the bar', () => {
    const header = (props: Partial<Parameters<typeof ScreenHeader>[0]> = {}) => (
      <ScreenHeader
        title="Settings"
        onBack={() => {}}
        backLabel="Go back"
        action={<button type="button">Edit</button>}
        {...props}
      />
    )

    it('lays the field in the bar itself, not above or below it', () => {
      renderWithProviders(header({ search: <input aria-label="Search" /> }))
      const field = screen.getByRole('textbox', { name: 'Search' })
      expect(field.closest('[data-slot="header"]')).not.toBeNull()
    })

    it('stands the usual contents down while the field is there', () => {
      renderWithProviders(header({ search: <input aria-label="Search" /> }))
      expect(screen.getByRole('button', { name: 'Go back' }).closest('[inert]')).not.toBeNull()
      expect(screen.getByRole('button', { name: 'Edit' }).closest('[inert]')).not.toBeNull()
    })

    it('gives the bar back when the field goes', () => {
      const { rerender } = renderWithProviders(header({ search: <input aria-label="Search" /> }))
      rerender(header())
      expect(screen.getByRole('button', { name: 'Go back' }).closest('[inert]')).toBeNull()
      expect(screen.getByRole('button', { name: 'Edit' }).closest('[inert]')).toBeNull()
    })
  })
})
