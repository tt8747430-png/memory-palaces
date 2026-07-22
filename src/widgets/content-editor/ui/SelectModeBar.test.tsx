import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectModeBar } from './SelectModeBar'

afterEach(cleanup)

describe('SelectModeBar', () => {
  it('offers "select all" and the selected count when not all are selected', async () => {
    const user = userEvent.setup()
    const onToggleAll = vi.fn()
    renderWithProviders(
      <SelectModeBar allSelected={false} count={2} onToggleAll={onToggleAll} onDone={() => {}} />,
    )
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onToggleAll).toHaveBeenCalledTimes(1)
  })

  it('offers "clear all" when everything is selected', () => {
    renderWithProviders(
      <SelectModeBar allSelected count={5} onToggleAll={() => {}} onDone={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
  })

  it('finishes select mode from the done control', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    renderWithProviders(
      <SelectModeBar allSelected={false} count={0} onToggleAll={() => {}} onDone={onDone} />,
    )
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
