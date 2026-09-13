import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SwipePreview } from './SwipePreview'

afterEach(cleanup)

describe('SwipePreview', () => {
  it('removes an action from its side from the badge on its corner', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <SwipePreview
        type="deck"
        config={{ leading: ['favorite', 'move'], trailing: ['delete'] }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove Move from this swipe' }))

    expect(onChange).toHaveBeenCalledWith({ leading: ['favorite'], trailing: ['delete'] })
    expect(screen.queryByRole('button', { name: 'Reorder Move' })).toBeNull()
  })
})
