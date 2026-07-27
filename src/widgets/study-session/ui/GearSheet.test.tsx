import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import type { StudySettingsControl } from '../model/use-study-settings'
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

function settingsControl(): StudySettingsControl {
  return {
    value: {
      direction: 'front',
      shuffle: false,
      textToSpeech: false,
      wordSpaces: false,
      typeInitialsOnly: false,
      shakeToUndo: false,
      swipe: DEFAULT_FLASHCARD_SWIPE,
      filter: { kind: 'all' },
    },
    filterCounts: { all: 10, due: 5, new: 3, learning: 2, flagged: 1 },
    set: vi.fn(),
    setSwipe: vi.fn(),
  }
}

function setup(overrides: Partial<Parameters<typeof GearSheet>[0]> = {}) {
  const props: Parameters<typeof GearSheet>[0] = {
    open: true,
    onClose: vi.fn(),
    mode: 'blur',
    canSpeak: false,
    quick,
    settings: settingsControl(),
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

  it('names the setting it is changing, rather than calling a setting-specific handler', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('switch', { name: 'Shuffle cards' }))
    expect(props.settings.set).toHaveBeenCalledWith('shuffle', true)
  })

  it('picks a Study filter through the same one setter', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('button', { name: /due/i }))
    expect(props.settings.set).toHaveBeenCalledWith('filter', { kind: 'due' })
  })

  it('finishes the session from the footer action', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('button', { name: 'Finish' }))
    expect(props.onFinish).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})
