import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { TodayTrainingCard } from './TodayTrainingCard'

afterEach(cleanup)

function renderCard(props: Partial<Parameters<typeof TodayTrainingCard>[0]> = {}) {
  const handlers = { onStartTraining: vi.fn(), onCreatePalace: vi.fn() }
  const result = render(
    <I18nextProvider i18n={i18n}>
      <TodayTrainingCard hasPalaces {...handlers} {...props} />
    </I18nextProvider>,
  )
  return { ...handlers, ...result }
}

describe('TodayTrainingCard', () => {
  it('prompts the daily session when the user has palaces', async () => {
    const user = userEvent.setup()
    const { onStartTraining, onCreatePalace } = renderCard({ hasPalaces: true })

    expect(screen.getByText("Today's training")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /start training/i }))

    expect(onStartTraining).toHaveBeenCalledTimes(1)
    expect(onCreatePalace).not.toHaveBeenCalled()
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
