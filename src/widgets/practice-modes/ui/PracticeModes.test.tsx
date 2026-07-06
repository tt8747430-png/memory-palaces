import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { PracticeModes, type PracticeModesProps } from './PracticeModes'

afterEach(cleanup)

function renderModes(overrides: Partial<PracticeModesProps> = {}) {
  const onPractice = vi.fn()
  const onMatch = vi.fn()
  const onTest = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PracticeModes
          cardCount={overrides.cardCount ?? 5}
          questionCount={overrides.questionCount ?? 3}
          onPractice={onPractice}
          onMatch={onMatch}
          onTest={onTest}
          alwaysEnableTest={overrides.alwaysEnableTest}
        />
      </MotionConfig>
    </I18nextProvider>,
  )
  return { onPractice, onMatch, onTest }
}

describe('PracticeModes', () => {
  it('renders the Practice section with all six mode rows', () => {
    renderModes()
    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
    for (const name of [/type it/i, /first letters/i, /blur/i, /rebuild/i, /match/i, /test/i]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('reports the tapped study mode through onPractice', async () => {
    const user = userEvent.setup()
    const { onPractice, onMatch } = renderModes()

    await user.click(screen.getByRole('button', { name: /rebuild/i }))
    expect(onPractice).toHaveBeenCalledWith('words')

    await user.click(screen.getByRole('button', { name: /first letters/i }))
    expect(onPractice).toHaveBeenCalledWith('initials')

    await user.click(screen.getByRole('button', { name: /match/i }))
    expect(onMatch).toHaveBeenCalledTimes(1)
  })

  it('disables the study-mode rows without cards and Match below two', () => {
    renderModes({ cardCount: 1, questionCount: 0, alwaysEnableTest: true })
    expect(screen.getByRole('button', { name: /type it/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /match/i })).toBeDisabled()

    cleanup()
    renderModes({ cardCount: 0 })
    expect(screen.getByRole('button', { name: /type it/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /blur/i })).toBeDisabled()
  })

  it('keeps Test enabled without questions only when it opens authoring', () => {
    renderModes({ questionCount: 0, alwaysEnableTest: true })
    expect(screen.getByRole('button', { name: /test/i })).toBeEnabled()

    cleanup()
    renderModes({ questionCount: 0 })
    expect(screen.getByRole('button', { name: /test/i })).toBeDisabled()
  })
})
