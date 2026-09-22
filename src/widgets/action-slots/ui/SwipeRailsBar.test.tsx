import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SwipeConfig } from '@/shared/config/swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SwipeRailsBar } from './SwipeRailsBar'

afterEach(cleanup)

const bar = (config: SwipeConfig) => {
  const onChange = vi.fn()
  renderWithProviders(<SwipeRailsBar type="deck" config={config} onChange={onChange} />)
  return onChange
}

describe('SwipeRailsBar', () => {
  it('draws a row of this kind with both its swipes open, every cap draggable', () => {
    bar({ leading: ['favorite'], trailing: ['move', 'delete'] })
    expect(screen.getByText('Deck name')).toBeInTheDocument()
    expect(screen.getByLabelText('Reorder Favorite')).toBeInTheDocument()
    expect(screen.getByLabelText('Reorder Move')).toBeInTheDocument()
    expect(screen.getByLabelText('Reorder Delete')).toBeInTheDocument()
  })

  it('takes a cap off whichever side it is on, from its own badge', async () => {
    const onChange = bar({ leading: ['favorite'], trailing: ['move', 'delete'] })
    await userEvent.click(screen.getByRole('button', { name: 'Remove Favorite' }))
    expect(onChange).toHaveBeenLastCalledWith({ leading: [], trailing: ['move', 'delete'] })
    await userEvent.click(screen.getByRole('button', { name: 'Remove Move' }))
    expect(onChange).toHaveBeenLastCalledWith({ leading: ['favorite'], trailing: ['delete'] })
  })

  it('lets every cap come off — an empty swipe is a usable swipe', () => {
    bar({ leading: [], trailing: ['delete'] })
    expect(screen.getByRole('button', { name: 'Remove Delete' })).toBeInTheDocument()
  })
})
