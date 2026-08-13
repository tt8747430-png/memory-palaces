import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AlgorithmSheet } from './AlgorithmSheet'

afterEach(cleanup)

const open = (value: 'fast' | 'spaced', onChange = vi.fn()) => {
  renderWithProviders(
    <AlgorithmSheet open value={value} onOpenChange={() => {}} onChange={onChange} />,
  )
  return onChange
}

describe('AlgorithmSheet', () => {
  it('offers exactly the two algorithms', async () => {
    open('fast')
    expect(await screen.findByRole('radio', { name: /Fast review/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /General spaced repetition/ })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marks the current one', async () => {
    open('spaced')
    expect(await screen.findByRole('radio', { name: /General spaced repetition/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('reports a change', async () => {
    const user = userEvent.setup()
    const onChange = open('fast')
    await user.click(await screen.findByRole('radio', { name: /General spaced repetition/ }))
    expect(onChange).toHaveBeenCalledWith('spaced')
  })
})
