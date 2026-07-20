import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type SwipeAction, SwipeRow } from './swipe-row'

const leadingAction: SwipeAction = {
  id: 'favorite',
  icon: <span data-testid="leading-icon" />,
  label: 'Favorite',
  onAction: () => {},
}

const trailingAction: SwipeAction = {
  id: 'delete',
  icon: <span data-testid="trailing-icon" />,
  label: 'Delete',
  onAction: () => {},
}

describe('SwipeRow', () => {
  it('renders its children alongside the leading and trailing action trays', () => {
    render(
      <SwipeRow leading={[leadingAction]} trailing={[trailingAction]}>
        <div>Row content</div>
      </SwipeRow>,
    )

    expect(screen.getByText('Row content')).toBeInTheDocument()
    // The trays sit in `aria-hidden` wrappers (they're swipe-only affordances,
    // not keyboard-reachable), so querying their buttons requires `hidden: true`.
    expect(screen.getByRole('button', { name: 'Favorite', hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete', hidden: true })).toBeInTheDocument()
  })

  it('fires a child onClick when the row is not mid-swipe', async () => {
    const onClick = vi.fn()
    render(
      <SwipeRow leading={[leadingAction]} trailing={[trailingAction]}>
        <button type="button" onClick={onClick}>
          Open
        </button>
      </SwipeRow>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
