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
})
