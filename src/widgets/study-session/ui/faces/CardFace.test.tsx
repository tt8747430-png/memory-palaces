import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardFace } from './CardFace'

afterEach(cleanup)

function setup(overrides: Partial<Parameters<typeof CardFace>[0]> = {}) {
  const onSpeak = vi.fn()
  const onChangeMode = vi.fn()
  const onOpenGear = vi.fn()
  renderWithProviders(
    <CardFace
      flagged={false}
      canSpeak
      speakText="The answer"
      onSpeak={onSpeak}
      active
      mode="blur"
      onChangeMode={onChangeMode}
      onOpenGear={onOpenGear}
      footer={<span>Footer slot</span>}
      {...overrides}
    >
      <p>Body content</p>
    </CardFace>,
  )
  return { onSpeak, onChangeMode, onOpenGear }
}

describe('CardFace', () => {
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
