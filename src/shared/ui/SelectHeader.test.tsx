import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectHeader } from './SelectHeader'

afterEach(cleanup)

describe('SelectHeader', () => {
  it('offers "select all" and states the count', async () => {
    const user = userEvent.setup()
    const onToggleAll = vi.fn()
    renderWithProviders(
      <SelectHeader count={2} allSelected={false} onToggleAll={onToggleAll} onCancel={() => {}} />,
    )
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onToggleAll).toHaveBeenCalledTimes(1)
  })

  it('offers "clear all" once everything on screen is selected', () => {
    renderWithProviders(
      <SelectHeader count={5} allSelected onToggleAll={() => {}} onCancel={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
  })

  it('ends the selection from cancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderWithProviders(
      <SelectHeader count={0} allSelected={false} onToggleAll={() => {}} onCancel={onCancel} />,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
