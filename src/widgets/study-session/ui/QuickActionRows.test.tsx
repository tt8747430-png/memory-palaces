import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { QuickActionRows, type QuickActionsModel } from './QuickActionRows'

afterEach(cleanup)

function model(overrides: Partial<QuickActionsModel> = {}): QuickActionsModel {
  return {
    flagged: false,
    canEdit: true,
    canSpeak: false,
    canUndo: true,
    onUndo: vi.fn(),
    onFlag: vi.fn(),
    onEdit: vi.fn(),
    onSpeak: vi.fn(),
    onSkip: vi.fn(),
    onRestart: vi.fn(),
    ...overrides,
  }
}

describe('QuickActionRows', () => {
  it('runs an action and then the after callback', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    const after = vi.fn()
    renderWithProviders(<QuickActionRows model={model({ onUndo })} after={after} />)
    await user.click(screen.getByRole('button', { name: 'Undo last card' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
  })

  it('disables undo when there is nothing to undo', () => {
    renderWithProviders(<QuickActionRows model={model({ canUndo: false })} />)
    expect(screen.getByRole('button', { name: 'Undo last card' })).toBeDisabled()
  })

  it('only offers read-aloud when speech is available', () => {
    const { rerender } = renderWithProviders(<QuickActionRows model={model({ canSpeak: false })} />)
    expect(screen.queryByRole('button', { name: 'Read aloud' })).toBeNull()
    rerender(<QuickActionRows model={model({ canSpeak: true })} />)
    expect(screen.getByRole('button', { name: 'Read aloud' })).toBeInTheDocument()
  })
})
