import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SelectHeaderProps } from './SelectHeader'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectHeader } from './SelectHeader'

afterEach(cleanup)

const selectionOf = (
  overrides: Partial<SelectHeaderProps['selection']> = {},
): SelectHeaderProps['selection'] => ({
  count: 0,
  allSelected: false,
  toggleAll: () => {},
  exit: () => {},
  ...overrides,
})

describe('SelectHeader', () => {
  it('offers "select all" and states the count', async () => {
    const user = userEvent.setup()
    const toggleAll = vi.fn()
    renderWithProviders(<SelectHeader selection={selectionOf({ count: 2, toggleAll })} />)
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(toggleAll).toHaveBeenCalledTimes(1)
  })

  it('offers "clear all" once everything on screen is selected', () => {
    renderWithProviders(<SelectHeader selection={selectionOf({ count: 5, allSelected: true })} />)
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
  })

  it('ends the selection from cancel', async () => {
    const user = userEvent.setup()
    const exit = vi.fn()
    renderWithProviders(<SelectHeader selection={selectionOf({ exit })} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(exit).toHaveBeenCalledTimes(1)
  })
})
