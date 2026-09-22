import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Check } from 'lucide-react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ResultScreen } from './ResultScreen'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const icon = <Check aria-hidden />

const onDone = vi.fn()
const onAgain = vi.fn()

function render(stats?: { id: string; value: string; label: string }[]) {
  renderWithProviders(
    <ResultScreen
      icon={icon}
      title="Study session complete"
      message="8 cards reviewed"
      stats={stats?.map((stat) => ({ ...stat, icon }))}
      action={{ label: 'Done', onClick: onDone }}
      secondaryAction={{ label: 'Again', onClick: onAgain }}
    />,
  )
}

describe('ResultScreen', () => {
  it('wears the app’s chrome, so the status bar matches it while it is up', () => {
    render()
    const box = document.querySelector('[data-slot="result-screen"]')
    expect(box).toHaveClass('chrome', 'fixed', 'inset-0')
  })

  it('reads the top of the app, not the top of a study session that has ended', () => {
    render()
    expect(document.querySelector('[data-slot="result-screen"] .pt-safe')).toBeInTheDocument()
  })

  it('shows each stat as a figure under its label', () => {
    render([
      { id: 'known', value: '5', label: 'Mastered' },
      { id: 'learning', value: '3', label: 'Still learning' },
    ])
    expect(screen.getByText('Mastered').previousElementSibling).toHaveTextContent('5')
    expect(screen.getByText('Still learning').previousElementSibling).toHaveTextContent('3')
  })

  it('draws no stat row when there is nothing to count', () => {
    render()
    expect(screen.queryByText('Mastered')).not.toBeInTheDocument()
  })

  it('fires the primary action and the quieter one beside it', async () => {
    const user = userEvent.setup()
    render()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Again' }))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onAgain).toHaveBeenCalledTimes(1)
  })

  it('puts the quieter action beside the primary one, as text rather than a second button face', () => {
    render()
    const done = screen.getByRole('button', { name: 'Done' })
    const again = screen.getByRole('button', { name: 'Again' })
    expect(again.parentElement).toBe(done.parentElement)
    expect(again).not.toHaveAttribute('data-slot', 'button')
  })
})
