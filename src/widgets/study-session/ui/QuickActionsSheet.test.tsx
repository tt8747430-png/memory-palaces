import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { QuickActionsSheet, type QuickActionsSheetProps } from './QuickActionsSheet'

afterEach(cleanup)

function setup(overrides: Partial<QuickActionsSheetProps> = {}) {
  const props: QuickActionsSheetProps = {
    open: true,
    onClose: vi.fn(),
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
  renderWithProviders(<QuickActionsSheet {...props} />)
  return props
}

describe('QuickActionsSheet', () => {
  it('renders the quick actions in a titled sheet', async () => {
    setup()
    expect(await screen.findByText('Quick actions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip for now' })).toBeInTheDocument()
  })

  it('runs an action and closes the sheet', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }))
    expect(props.onSkip).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})
