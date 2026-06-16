import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SegmentedControl } from './SegmentedControl'

afterEach(cleanup)

const options = [
  { value: 'statistics', label: 'Statistics' },
  { value: 'achievements', label: 'Achievements' },
] as const

describe('SegmentedControl', () => {
  it('renders every option as a button', () => {
    render(<SegmentedControl options={options} value="statistics" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Statistics' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Achievements' })).toBeInTheDocument()
  })

  it('marks the active option with aria-pressed', () => {
    render(<SegmentedControl options={options} value="statistics" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Statistics' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Achievements' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the option value when a segment is tapped', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="statistics" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Achievements' }))
    expect(onChange).toHaveBeenCalledWith('achievements')
  })
})
