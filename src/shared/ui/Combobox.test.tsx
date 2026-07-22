import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Combobox, type ComboboxOption } from './Combobox'

afterEach(cleanup)

const OPTIONS: ComboboxOption<string>[] = [
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recent' },
]

describe('Combobox', () => {
  it('shows the selected option in the trigger', () => {
    renderWithProviders(
      <Combobox label="Sort by" value="recent" options={OPTIONS} onChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Sort by' })).toHaveTextContent('Recent')
  })

  it('opens the option list and fires onChange, then closes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <Combobox label="Sort by" value="name" options={OPTIONS} onChange={onChange} />,
    )
    await user.click(screen.getByRole('button', { name: 'Sort by' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Recent' }))
    expect(onChange).toHaveBeenCalledWith('recent')
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Recent' })).toBeNull())
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Combobox label="Sort by" value="name" options={OPTIONS} onChange={() => {}} disabled />,
    )
    const trigger = screen.getByRole('button', { name: 'Sort by' })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole('menuitem')).toBeNull()
  })
})
