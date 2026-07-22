import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Flag, Trash2 } from 'lucide-react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SwipeRow, type SwipeAction } from './SwipeRow'

afterEach(cleanup)

describe('SwipeRow', () => {
  it('renders its row content', () => {
    renderWithProviders(
      <SwipeRow>
        <div>Row content</div>
      </SwipeRow>,
    )
    expect(screen.getByText('Row content')).toBeInTheDocument()
  })

  it('wires leading and trailing tray actions to their handlers', async () => {
    const user = userEvent.setup()
    const onFlag = vi.fn()
    const onDelete = vi.fn()
    const leading: SwipeAction[] = [
      { id: 'flag', icon: <Flag aria-hidden />, label: 'Flag', accent: 'gold', onAction: onFlag },
    ]
    const trailing: SwipeAction[] = [
      {
        id: 'delete',
        icon: <Trash2 aria-hidden />,
        label: 'Delete',
        accent: 'red',
        onAction: onDelete,
      },
    ]
    renderWithProviders(
      <SwipeRow leading={leading} trailing={trailing}>
        <div>Row content</div>
      </SwipeRow>,
    )

    // Trays sit behind the row (aria-hidden), so include hidden elements in the query.
    await user.click(screen.getByRole('button', { name: 'Delete', hidden: true }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onFlag).not.toHaveBeenCalled()
  })
})
