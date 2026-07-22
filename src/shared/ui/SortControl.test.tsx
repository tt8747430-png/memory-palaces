import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrowDownAZ, Clock } from 'lucide-react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SortControl, type SortControlOption } from './SortControl'

afterEach(cleanup)

const OPTIONS: SortControlOption<string>[] = [
  { value: 'name', label: 'Name', icon: <ArrowDownAZ aria-hidden /> },
  { value: 'recent', label: 'Recent', icon: <Clock aria-hidden /> },
]

describe('SortControl', () => {
  it('shows the active option in the trigger', () => {
    renderWithProviders(
      <SortControl label="Sort" value="recent" options={OPTIONS} onChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Sort' })).toHaveTextContent('Recent')
  })

  it('marks the active option and fires onChange when another is chosen', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <SortControl label="Sort" value="name" options={OPTIONS} onChange={onChange} />,
    )
    await user.click(screen.getByRole('button', { name: 'Sort' }))

    const nameItem = await screen.findByRole('menuitemradio', { name: 'Name' })
    expect(nameItem).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('menuitemradio', { name: 'Recent' }))
    expect(onChange).toHaveBeenCalledWith('recent')
  })
})
