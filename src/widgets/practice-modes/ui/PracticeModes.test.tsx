import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { PracticeModes, type PracticeModesProps } from './PracticeModes'

afterEach(cleanup)

function renderModes(overrides: Partial<PracticeModesProps> = {}) {
  const onMatch = vi.fn()
  const onTest = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <PracticeModes
          cardCount={overrides.cardCount ?? 5}
          questionCount={overrides.questionCount ?? 3}
          onMatch={onMatch}
          onTest={onTest}
          alwaysEnableTest={overrides.alwaysEnableTest}
        />
      </MotionConfig>
    </I18nextProvider>,
  )
  return { onMatch, onTest }
}

describe('PracticeModes', () => {
  it('renders the Match and Test rows', () => {
    renderModes()
    expect(screen.getByRole('button', { name: /match/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument()
  })

  it('reports taps through onMatch and onTest', async () => {
    const user = userEvent.setup()
    const { onMatch, onTest } = renderModes()

    await user.click(screen.getByRole('button', { name: /match/i }))
    expect(onMatch).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /test/i }))
    expect(onTest).toHaveBeenCalledTimes(1)
  })

  it('disables Match below two cards', () => {
    renderModes({ cardCount: 1, alwaysEnableTest: true })
    expect(screen.getByRole('button', { name: /match/i })).toBeDisabled()
  })

  it('keeps Test enabled without questions only when it opens authoring', () => {
    renderModes({ questionCount: 0, alwaysEnableTest: true })
    expect(screen.getByRole('button', { name: /test/i })).toBeEnabled()

    cleanup()
    renderModes({ questionCount: 0 })
    expect(screen.getByRole('button', { name: /test/i })).toBeDisabled()
  })
})
