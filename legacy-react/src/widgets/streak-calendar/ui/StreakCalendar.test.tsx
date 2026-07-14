import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { StreakCalendar } from './StreakCalendar'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 10)

function renderCalendar() {
  render(
    <I18nextProvider i18n={i18n}>
      <StreakCalendar trainingDays={['2026-01-10']} now={NOW} />
    </I18nextProvider>,
  )
}

describe('StreakCalendar', () => {
  it('renders the current month with its days', () => {
    renderCalendar()
    expect(screen.getByText('January 2026')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('navigates to the next month', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('February 2026')).toBeInTheDocument()
  })
})
