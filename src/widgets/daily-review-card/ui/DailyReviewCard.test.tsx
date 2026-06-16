import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { DailyReviewCard } from './DailyReviewCard'

afterEach(cleanup)

function renderCard(props: Partial<Parameters<typeof DailyReviewCard>[0]> = {}) {
  const onOpen = vi.fn()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <DailyReviewCard dueCount={3} onOpen={onOpen} {...props} />
    </I18nextProvider>,
  )
  return { onOpen, ...result }
}

describe('DailyReviewCard', () => {
  it('renders nothing when no cards are due', () => {
    const { container } = renderCard({ dueCount: 0 })
    expect(container).toBeEmptyDOMElement()
  })

  it('shows singular and plural due copy', () => {
    renderCard({ dueCount: 1 })
    expect(screen.getByText('1 card due across your palaces')).toBeInTheDocument()
    cleanup()
    renderCard({ dueCount: 5 })
    expect(screen.getByText('5 cards due across your palaces')).toBeInTheDocument()
  })

  it('caps the badge at 99+', () => {
    renderCard({ dueCount: 150 })
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('calls onOpen when tapped', async () => {
    const user = userEvent.setup()
    const { onOpen } = renderCard({ dueCount: 3 })
    await user.click(screen.getByRole('button', { name: /daily review/i }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
