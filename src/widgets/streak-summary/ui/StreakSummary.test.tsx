import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { StreakSummary } from './StreakSummary'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 10)

function renderSummary(props: Partial<React.ComponentProps<typeof StreakSummary>> = {}) {
  render(
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="always">
        <StreakSummary
          xp={300}
          streakCount={5}
          longestStreak={9}
          trainingDays={['2026-01-10']}
          now={NOW}
          {...props}
        />
      </MotionConfig>
    </I18nextProvider>,
  )
}

describe('StreakSummary', () => {
  it('derives the level from XP and shows the totals', () => {
    renderSummary()
    expect(screen.getByText('Level 2')).toBeInTheDocument()
    expect(screen.getByText('300 XP')).toBeInTheDocument()
  })

  it('shows current and longest streak figures', () => {
    renderSummary()
    expect(screen.getByText('Current streak')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })
})
