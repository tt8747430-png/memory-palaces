import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ToolbarEditor } from './ToolbarEditor'

afterEach(cleanup)

describe('ToolbarEditor', () => {
  it('removes an action from the badge on its corner', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    renderWithProviders(
      <ToolbarEditor
        actions={['move', 'delete']}
        canRemove
        onReorder={() => {}}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove Move from the toolbar' }))

    expect(onRemove).toHaveBeenCalledWith('move')
  })

  it('offers no remove badge on the last action left', () => {
    renderWithProviders(
      <ToolbarEditor
        actions={['move']}
        canRemove={false}
        onReorder={() => {}}
        onRemove={() => {}}
      />,
    )

    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
  })
})
