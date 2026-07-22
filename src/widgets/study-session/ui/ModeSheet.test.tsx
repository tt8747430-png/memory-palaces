import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ModeSheet } from './ModeSheet'

afterEach(cleanup)

describe('ModeSheet', () => {
  it('renders each study mode and marks the active one', async () => {
    renderWithProviders(<ModeSheet open onClose={() => {}} mode="blur" onMode={() => {}} />)
    expect(await screen.findByText('Study mode')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Blur/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Type/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects a mode and closes', async () => {
    const user = userEvent.setup()
    const onMode = vi.fn()
    const onClose = vi.fn()
    renderWithProviders(<ModeSheet open onClose={onClose} mode="blur" onMode={onMode} />)
    await user.click(await screen.findByRole('button', { name: /Type/ }))
    expect(onMode).toHaveBeenCalledWith('type')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
