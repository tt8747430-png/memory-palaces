import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardFace } from './CardFace'
import { makeFaceProps } from './face-fixtures'
import type { FaceProps } from './types'

afterEach(cleanup)

function setup(overrides: Partial<FaceProps> = {}) {
  const onSpeak = vi.fn()
  const onChangeMode = vi.fn()
  const onOpenGear = vi.fn()
  renderWithProviders(
    <CardFace
      face={makeFaceProps({ canSpeak: true, onSpeak, onChangeMode, onOpenGear, ...overrides })}
      speakText="The answer"
      footer={<span>Footer slot</span>}
    >
      <p>Body content</p>
    </CardFace>,
  )
  return { onSpeak, onChangeMode, onOpenGear }
}

describe('CardFace', () => {
  it("wears the deck's card style", () => {
    setup({ cardStyle: { preset: 'paper', font: 'serif', textSize: 22, alignment: 'left' } })
    const shell = screen.getByTestId('card-face')
    expect(shell.style.getPropertyValue('--card-style-size')).toBe('22px')
    expect(shell.style.getPropertyValue('--card-style-align')).toBe('left')
  })

  it('renders the children and footer slot', () => {
    setup()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer slot')).toBeInTheDocument()
  })

  it('reads the card aloud when speech is available', async () => {
    const user = userEvent.setup()
    const { onSpeak } = setup()
    await user.click(screen.getByRole('button', { name: 'Read aloud' }))
    expect(onSpeak).toHaveBeenCalledWith('The answer')
  })

  it('hides the read-aloud control when speech is unavailable', () => {
    setup({ canSpeak: false })
    expect(screen.queryByRole('button', { name: 'Read aloud' })).toBeNull()
  })

  it('fires the change-mode and gear controls', async () => {
    const user = userEvent.setup()
    const { onChangeMode, onOpenGear } = setup()
    await user.click(screen.getByRole('button', { name: 'Change study mode' }))
    expect(onChangeMode).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Study options' }))
    expect(onOpenGear).toHaveBeenCalledTimes(1)
  })
})
