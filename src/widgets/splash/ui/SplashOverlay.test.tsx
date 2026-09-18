import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { SplashOverlay } from './SplashOverlay'

afterEach(cleanup)

function renderSplash(waiting = false) {
  const onIntroDone = vi.fn()
  const onSkip = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <SplashOverlay waiting={waiting} onIntroDone={onIntroDone} onSkip={onSkip} />
    </I18nextProvider>,
  )
  return { onIntroDone, onSkip }
}

describe('SplashOverlay', () => {
  it('shows the brand and lets the learner skip the intro', async () => {
    const user = userEvent.setup()
    const { onSkip } = renderSplash()
    expect(screen.getByText('Mindscape')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('says when its intro has played', async () => {
    const { onIntroDone } = renderSplash()
    await waitFor(() => expect(onIntroDone).toHaveBeenCalled(), { timeout: 3000 })
  })

  it('says what it waits on while a first Sync runs, and offers to open now', async () => {
    const user = userEvent.setup()
    const { onSkip } = renderSplash(true)
    expect(screen.getByRole('status')).toHaveTextContent('Bringing in your decks…')
    await user.click(screen.getByRole('button', { name: 'Open now' }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('says nothing about syncing while it is only playing its intro', () => {
    renderSplash()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
