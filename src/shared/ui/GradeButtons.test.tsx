import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { GradeButtons } from './GradeButtons'

afterEach(cleanup)

const NOW = Date.UTC(2026, 0, 1)

function renderButtons(props: Partial<Parameters<typeof GradeButtons>[0]> = {}) {
  const onGrade = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <GradeButtons now={NOW} onGrade={onGrade} {...props} />
    </I18nextProvider>,
  )
  return onGrade
}

describe('GradeButtons', () => {
  it('renders all four grades with interval previews for a new card', () => {
    renderButtons()
    expect(screen.getByRole('button', { name: /again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
    // A brand-new card: Again schedules "now", Easy schedules "2d".
    expect(screen.getByText('now')).toBeInTheDocument()
    expect(screen.getByText('2d')).toBeInTheDocument()
  })

  it('calls onGrade with the chosen grade', async () => {
    const user = userEvent.setup()
    const onGrade = renderButtons()
    await user.click(screen.getByRole('button', { name: /easy/i }))
    expect(onGrade).toHaveBeenCalledWith('easy')
  })
})
