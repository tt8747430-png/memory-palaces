import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SpeedDial, type SpeedDialAction } from './SpeedDial'

afterEach(cleanup)

const icon = <Plus aria-hidden />

describe('SpeedDial', () => {
  it('toggles open to reveal actions and runs the chosen one, then closes', async () => {
    const user = userEvent.setup()
    const onDeck = vi.fn()
    const actions: SpeedDialAction[] = [
      { id: 'deck', label: 'New deck', icon, onSelect: onDeck },
      { id: 'folder', label: 'New folder', icon, onSelect: () => {} },
    ]
    renderWithProviders(<SpeedDial label="Create" actions={actions} />)

    const trigger = screen.getByRole('button', { name: 'Create' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'New deck' }))
    expect(onDeck).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'New deck' })).toBeNull())
  })

  it('fires a single action directly without a menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderWithProviders(
      <SpeedDial label="Create" actions={[{ id: 'deck', label: 'New deck', icon, onSelect }]} />,
    )
    const trigger = screen.getByRole('button', { name: 'New deck' })
    expect(trigger).not.toHaveAttribute('aria-haspopup')
    await user.click(trigger)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
