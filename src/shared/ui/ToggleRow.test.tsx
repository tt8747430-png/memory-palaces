import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Shuffle } from 'lucide-react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ToggleRow } from './ToggleRow'

afterEach(cleanup)

const icon = <Shuffle aria-hidden />

describe('ToggleRow', () => {
  it('exposes a switch reflecting the checked state', () => {
    renderWithProviders(<ToggleRow icon={icon} label="Shuffle" checked onChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Shuffle' })).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles to the opposite value on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <ToggleRow icon={icon} label="Shuffle" checked={false} onChange={onChange} />,
    )
    await user.click(screen.getByRole('switch', { name: 'Shuffle' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <ToggleRow icon={icon} label="Shuffle" checked={false} onChange={onChange} disabled />,
    )
    await user.click(screen.getByRole('switch', { name: 'Shuffle' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders an optional description', () => {
    renderWithProviders(
      <ToggleRow
        icon={icon}
        label="Shuffle"
        description="Randomise card order"
        checked={false}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText('Randomise card order')).toBeInTheDocument()
  })
})
