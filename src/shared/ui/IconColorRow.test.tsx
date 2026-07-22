import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { IconColorRow, type ColorOption } from './IconColorRow'

afterEach(cleanup)

const COLORS: readonly ColorOption[] = [
  { id: 'Rose', value: 'from-rose-500 to-pink-600' },
  { id: 'Sky', value: 'from-sky-500 to-blue-600' },
]

function setup(overrides: Partial<Parameters<typeof IconColorRow>[0]> = {}) {
  return (
    <IconColorRow
      icon="📁"
      color="from-rose-500 to-pink-600"
      onIconChange={() => {}}
      onColorChange={() => {}}
      colorOptions={COLORS}
      label="Appearance"
      iconLabel="Choose icon"
      {...overrides}
    />
  )
}

describe('IconColorRow', () => {
  it('renders the label and a swatch per color option', () => {
    renderWithProviders(setup())
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rose' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sky' })).toBeInTheDocument()
  })

  it('marks the active color as pressed', () => {
    renderWithProviders(setup({ color: 'from-sky-500 to-blue-600' }))
    expect(screen.getByRole('button', { name: 'Sky' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Rose' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('fires onColorChange with the chosen swatch value', async () => {
    const user = userEvent.setup()
    const onColorChange = vi.fn()
    renderWithProviders(setup({ onColorChange }))
    await user.click(screen.getByRole('button', { name: 'Sky' }))
    expect(onColorChange).toHaveBeenCalledWith('from-sky-500 to-blue-600')
  })
})
