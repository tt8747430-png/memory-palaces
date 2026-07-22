import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

afterEach(cleanup)

function Example({
  value,
  onValueChange = () => {},
}: {
  value: string[]
  onValueChange?: (value: string[]) => void
}) {
  return (
    <ToggleGroup value={value} onValueChange={onValueChange}>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>
  )
}

describe('ToggleGroup', () => {
  it('reflects the selected item via aria-pressed', () => {
    renderWithProviders(<Example value={['grid']} />)
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('fires onValueChange with the newly pressed value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderWithProviders(<Example value={['list']} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Grid' }))
    expect(onValueChange).toHaveBeenCalledWith(['grid'], expect.anything())
  })

  it('does not toggle a disabled item', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderWithProviders(
      <ToggleGroup value={[]} onValueChange={onValueChange}>
        <ToggleGroupItem value="list" disabled>
          List
        </ToggleGroupItem>
      </ToggleGroup>,
    )
    await user.click(screen.getByRole('button', { name: 'List' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
