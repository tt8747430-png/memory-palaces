import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { GearSheet } from './GearSheet'
import type { QuickActionsModel } from './QuickActionRows'

afterEach(cleanup)

const quick: QuickActionsModel = {
  flagged: false,
  canEdit: true,
  canSpeak: false,
  canUndo: false,
  onUndo: vi.fn(),
  onFlag: vi.fn(),
  onEdit: vi.fn(),
  onSpeak: vi.fn(),
  onSkip: vi.fn(),
  onRestart: vi.fn(),
}

function setup(overrides: Partial<Parameters<typeof GearSheet>[0]> = {}) {
  const props: Parameters<typeof GearSheet>[0] = {
    open: true,
    onClose: vi.fn(),
    mode: 'blur',
    canSpeak: false,
    quick,
    typeInitialsOnly: false,
    onTypeInitialsOnly: vi.fn(),
    wordSpaces: false,
    onWordSpaces: vi.fn(),
    swipeConfig: DEFAULT_FLASHCARD_SWIPE,
    onSwipe: vi.fn(),
    scope: { kind: 'all' },
    scopeCounts: { all: 10, due: 5, new: 3, learning: 2, flagged: 1 },
    onScope: vi.fn(),
    shuffle: false,
    onShuffle: vi.fn(),
    textToSpeech: false,
    onTextToSpeech: vi.fn(),
    shakeToUndo: false,
    onShakeToUndo: vi.fn(),
    direction: 'front',
    onDirection: vi.fn(),
    onFinish: vi.fn(),
    ...overrides,
  }
  renderWithProviders(<GearSheet {...props} />)
  return props
}

describe('GearSheet', () => {
  it('renders the study options sheet', async () => {
    setup()
    expect(await screen.findByText('Study options')).toBeInTheDocument()
  })

  it('toggles the shuffle setting', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('switch', { name: 'Shuffle cards' }))
    expect(props.onShuffle).toHaveBeenCalledWith(true)
  })

  it('finishes the session from the footer action', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('button', { name: 'Finish' }))
    expect(props.onFinish).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})
