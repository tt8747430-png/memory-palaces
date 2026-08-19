import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SessionHeader } from './SessionScreen'

afterEach(cleanup)

describe('SessionHeader', () => {
  it('shows the title when there is no progress to report', () => {
    renderWithProviders(<SessionHeader title="Physics" backLabel="Back" onBack={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Physics' })).toBeInTheDocument()
  })

  it('replaces the title with a count pill and draws the fill', () => {
    renderWithProviders(
      <SessionHeader
        title="Physics"
        backLabel="Back"
        onBack={() => {}}
        progress={{ done: 3, total: 10 }}
      />,
    )
    expect(screen.queryByRole('heading', { name: 'Physics' })).toBeNull()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('/10')).toBeInTheDocument()
    expect(screen.getByTestId('session-progress-fill')).toHaveStyle({ width: '30%' })
  })

  it('draws an empty track before anything is done', () => {
    renderWithProviders(
      <SessionHeader
        title="Physics"
        backLabel="Back"
        onBack={() => {}}
        progress={{ done: 0, total: 0 }}
      />,
    )
    expect(screen.getByTestId('session-progress-fill')).toHaveStyle({ width: '0%' })
  })
})
