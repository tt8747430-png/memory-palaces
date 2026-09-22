import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrowRight } from 'lucide-react'
import type { ActionId } from '@/shared/config/actions'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ActionSlots, type ActionSlotsProps } from './ActionSlots'

afterEach(cleanup)

const props = (over: Partial<ActionSlotsProps<ActionId>> = {}): ActionSlotsProps<ActionId> => ({
  ids: ['favorite', 'move'],
  max: 4,
  options: ['archive', 'delete'],
  label: 'Swipe right',
  onReorder: vi.fn(),
  onAdd: vi.fn(),
  onRemove: vi.fn(),
  ...over,
})

const render = (over: Partial<ActionSlotsProps<ActionId>> = {}) => {
  const all = props(over)
  renderWithProviders(<ActionSlots {...all} />)
  return all
}

describe('ActionSlots', () => {
  it('names the strip, counts what is on it, and names every slot it holds', () => {
    render({ icon: <ArrowRight aria-hidden /> })
    expect(screen.getByText('Swipe right')).toBeInTheDocument()
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reorder Favorite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reorder Move' })).toBeInTheDocument()
  })

  it('takes an action off the strip from the badge on its corner', async () => {
    const user = userEvent.setup()
    const all = render()
    await user.click(screen.getByRole('button', { name: 'Remove Move' }))
    expect(all.onRemove).toHaveBeenCalledWith('move')
  })

  it('fills a slot from the picker the plus opens', async () => {
    const user = userEvent.setup()
    const all = render()

    await user.click(screen.getByRole('button', { name: 'Add an action to Swipe right' }))
    await user.click(await screen.findByRole('button', { name: 'Archive' }))

    expect(all.onAdd).toHaveBeenCalledWith('archive')
  })

  it('offers no plus at all once every slot is taken', () => {
    render({ ids: ['favorite', 'move'], max: 2 })
    expect(screen.queryByRole('button', { name: /^Add an action/ })).toBeNull()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('says so, rather than nothing, when the picker has nothing left to offer', async () => {
    const user = userEvent.setup()
    render({ options: [] })
    await user.click(screen.getByRole('button', { name: 'Add an action to Swipe right' }))
    expect(await screen.findByText('Every action is already in use.')).toBeInTheDocument()
  })

  it('invites the learner to fill an empty strip', () => {
    render({ ids: [] })
    expect(screen.getByText('Empty — tap + to put an action here.')).toBeInTheDocument()
  })

  it('holds the last slot where the strip may not be emptied', () => {
    render({ ids: ['delete'], min: 1 })
    expect(screen.queryByRole('button', { name: 'Remove Delete' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Reorder Delete' })).toBeInTheDocument()
  })
})
