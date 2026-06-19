import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { TodayTrainingCard } from './TodayTrainingCard'

afterEach(cleanup)

function renderCard(props: Partial<Parameters<typeof TodayTrainingCard>[0]> = {}) {
  const handlers = {
    onStartReview: vi.fn(),
    onStartTraining: vi.fn(),
    onCreatePalace: vi.fn(),
  }
  const result = render(
    <I18nextProvider i18n={i18n}>
      <TodayTrainingCard hasPalaces {...handlers} {...props} />
    </I18nextProvider>,
  )
  return { ...handlers, ...result }
}

describe('TodayTrainingCard', () => {
  it('starts the top suggested room when palaces exist and nothing is due', async () => {
    const user = userEvent.setup()
    const { onStartTraining, onStartReview } = renderCard({ hasPalaces: true, dueCount: 0 })

    expect(screen.getByText("Today's training")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /start training/i }))

    expect(onStartTraining).toHaveBeenCalledTimes(1)
    expect(onStartReview).not.toHaveBeenCalled()
  })

  it('launches the daily review when cards are due', async () => {
    const user = userEvent.setup()
    const { onStartReview, onStartTraining } = renderCard({ hasPalaces: true, dueCount: 3 })

    await user.click(screen.getByRole('button', { name: /review 3 cards/i }))

    expect(onStartReview).toHaveBeenCalledTimes(1)
    expect(onStartTraining).not.toHaveBeenCalled()
  })

  it('falls back to the palaces list when there is no trainable room', async () => {
    const user = userEvent.setup()
    const { onStartTraining } = renderCard({
      hasPalaces: true,
      dueCount: 0,
      hasTrainableRoom: false,
    })

    await user.click(screen.getByRole('button', { name: /view palaces/i }))

    expect(onStartTraining).toHaveBeenCalledTimes(1)
  })

  it('prompts building the first palace when there are none', async () => {
    const user = userEvent.setup()
    const { onStartTraining, onCreatePalace } = renderCard({ hasPalaces: false })

    expect(screen.getByText('Build your memory palace')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /create palace/i }))

    expect(onCreatePalace).toHaveBeenCalledTimes(1)
    expect(onStartTraining).not.toHaveBeenCalled()
  })
})
