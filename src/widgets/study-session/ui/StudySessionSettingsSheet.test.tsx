import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import type { StudySettingsControl } from '../model/use-study-settings'
import { StudySessionSettingsSheet } from './StudySessionSettingsSheet'

afterEach(cleanup)

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

function setup(overrides: Partial<Parameters<typeof StudySessionSettingsSheet>[0]> = {}) {
  const props: Parameters<typeof StudySessionSettingsSheet>[0] = {
    open: true,
    onClose: vi.fn(),
    algorithm: 'spaced',
    canSpeak: false,
    settings: settingsControl(),
    onFinish: vi.fn(),
    ...overrides,
  }
  renderWithProviders(<StudySessionSettingsSheet {...props} />)
  return props
}

describe('StudySessionSettingsSheet', () => {
  it('renders the study session settings sheet', async () => {
    setup()
    expect(await screen.findByText('Study session settings')).toBeInTheDocument()
  })

  it('names the setting it is changing, rather than calling a setting-specific handler', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('switch', { name: 'Shuffle cards' }))
    expect(props.settings.set).toHaveBeenCalledWith('shuffle', true)
  })

  it('stops the study session from the finish button, saying what that does', async () => {
    const user = userEvent.setup()
    const props = setup()
    expect(await screen.findByText(/already graded stay saved/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Finish study session/ }))
    expect(props.onFinish).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('pins a close bar that only dismisses the sheet', async () => {
    const user = userEvent.setup()
    const props = setup()
    // Named apart from the header's icon dismiss, so the two are distinguishable by name alone.
    await user.click(await screen.findByRole('button', { name: 'Close settings' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onFinish).not.toHaveBeenCalled()
  })

  it('picks a Study filter through the same one setter', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(await screen.findByRole('button', { name: /due/i }))
    expect(props.settings.set).toHaveBeenCalledWith('filter', { kind: 'due' })
  })

  it('offers no filter for a kind the study session has none of', async () => {
    const settings = settingsControl()
    setup({ settings: { ...settings, filterCounts: { ...settings.filterCounts, flagged: 0 } } })
    expect(await screen.findByRole('button', { name: /Learning/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Flagged/ })).toBeNull()
  })
})

describe('StudySessionSettingsSheet under fast review', () => {
  it('drops the Due filter, since nothing is scheduled', async () => {
    setup({ algorithm: 'fast' })
    expect(await screen.findByRole('button', { name: /All/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Due/ })).toBeNull()
  })
})
