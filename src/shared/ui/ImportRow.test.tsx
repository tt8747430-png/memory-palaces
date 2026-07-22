import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ImportRow } from './ImportRow'

afterEach(cleanup)

describe('ImportRow', () => {
  it('renders title and subtitle and fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <ImportRow
        icon={<svg aria-hidden="true" />}
        title="Import from CSV"
        subtitle="Upload a spreadsheet"
        onClick={onClick}
      />,
    )
    const row = screen.getByRole('button', { name: /import from csv/i })
    expect(row).toHaveTextContent('Upload a spreadsheet')
    await user.click(row)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <ImportRow
        icon={<svg aria-hidden="true" />}
        title="Import"
        subtitle="Disabled"
        onClick={onClick}
        disabled
      />,
    )
    await user.click(screen.getByRole('button', { name: /import/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders an optional badge', () => {
    renderWithProviders(
      <ImportRow
        icon={<svg aria-hidden="true" />}
        title="Import"
        subtitle="New source"
        onClick={() => {}}
        badge="Beta"
      />,
    )
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
