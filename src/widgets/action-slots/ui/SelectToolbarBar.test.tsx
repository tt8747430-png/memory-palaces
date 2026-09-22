import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectToolbarBar } from './SelectToolbarBar'

afterEach(cleanup)

const bar = (config: SelectToolbarConfig) => {
  const onChange = vi.fn()
  renderWithProviders(<SelectToolbarBar config={config} onChange={onChange} />)
  return onChange
}

describe('SelectToolbarBar', () => {
  it('draws the bar itself, one draggable slot per action', () => {
    bar(['move', 'archive', 'delete'])
    expect(screen.getByLabelText('Reorder Move')).toBeInTheDocument()
    expect(screen.getByLabelText('Reorder Archive')).toBeInTheDocument()
    expect(screen.getByLabelText('Reorder Delete')).toBeInTheDocument()
  })

  it('takes an action off from its own badge, leaving the rest in order', async () => {
    const onChange = bar(['move', 'archive', 'delete'])
    await userEvent.click(screen.getByRole('button', { name: 'Remove Archive' }))
    expect(onChange).toHaveBeenCalledWith(['move', 'delete'])
  })

  it('keeps its last action — a bar with nothing on it cannot be got out of', () => {
    bar(['delete'])
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument()
  })
})
