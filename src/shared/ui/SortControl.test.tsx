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

describe('SortControl separators', () => {
  const grouped: SortControlOption<string>[] = [
    { value: 'name', label: 'Name', icon: <ArrowDownAZ aria-hidden />, group: 'core' },
    { value: 'recent', label: 'Recent', icon: <Clock aria-hidden />, group: 'core' },
    { value: 'canon', label: 'Canon', icon: <Clock aria-hidden />, group: 'contributed' },
  ]

  const separators = () => document.querySelectorAll('[role="separator"]')

  it('draws one separator where the run of options changes, never before the first', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SortControl label="Sort" value="name" options={grouped} onChange={() => {}} />,
    )
    await user.click(screen.getByRole('button', { name: 'Sort' }))
    await screen.findByRole('menuitemradio', { name: 'Canon' })
    expect(separators()).toHaveLength(1)
  })

  it('draws none once the contributed run is filtered out — no orphan rule to trip over', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SortControl label="Sort" value="name" options={grouped.slice(0, 2)} onChange={() => {}} />,
    )
    await user.click(screen.getByRole('button', { name: 'Sort' }))
    await screen.findByRole('menuitemradio', { name: 'Recent' })
    expect(separators()).toHaveLength(0)
  })
})
