import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { type VerseCard, VerseStudy, type VerseStudyPrefs } from './VerseStudy'

afterEach(cleanup)

const VERSES: VerseCard[] = [
  { id: 'v1', reference: '1 John 4:8', text: 'God is love', memorized: false },
]

const DEFAULT_PREFS: VerseStudyPrefs = { mode: 'blur', shuffle: false, wordSpaces: true }

function renderVerse(verses: VerseCard[] = VERSES, prefs: Partial<VerseStudyPrefs> = {}) {
  const onToggleMemorized = vi.fn()
  const onPrefsChange = vi.fn()
  const onEditVerse = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <VerseStudy
          verses={verses}
          title="Epistles"
          subtitle="Scripture"
          prefs={{ ...DEFAULT_PREFS, ...prefs }}
          onPrefsChange={onPrefsChange}
          onBack={() => {}}
          onToggleMemorized={onToggleMemorized}
          onEditVerse={onEditVerse}
        />
      </MotionConfig>
    </I18nextProvider>,
  )
  return { onToggleMemorized, onPrefsChange, onEditVerse }
}

describe('VerseStudy', () => {
  it('shows the verse reference and toggles the memorized marker', async () => {
    const user = userEvent.setup()
    const { onToggleMemorized } = renderVerse()

    expect(screen.getByText('1 John 4:8')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /mark memorized/i }))
    expect(onToggleMemorized).toHaveBeenCalledWith('v1')
  })

  it('reports the chosen mode to the host', async () => {
    const user = userEvent.setup()
    const { onPrefsChange } = renderVerse()

    await user.click(screen.getByRole('button', { name: 'Type' }))
    expect(onPrefsChange).toHaveBeenCalledWith({ mode: 'type' })
  })

  it('confirms a word-perfect attempt in Type mode', async () => {
    const user = userEvent.setup()
    renderVerse(VERSES, { mode: 'type' })

    await user.type(await screen.findByRole('textbox'), 'God is love')

    expect(await screen.findByText(/word-perfect/i)).toBeInTheDocument()
  })

  it('shows an empty state when there are no verses', () => {
    renderVerse([])
    expect(screen.getByText(/no verses yet/i)).toBeInTheDocument()
  })
})
