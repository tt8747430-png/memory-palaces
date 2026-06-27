import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { SplashOverlay } from './SplashOverlay'

afterEach(cleanup)

function renderSplash() {
  const onDone = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <SplashOverlay onDone={onDone} />
    </I18nextProvider>,
  )
  return { onDone }
}

describe('SplashOverlay', () => {
  it('shows the brand and dismisses on skip', async () => {
    const user = userEvent.setup()
    const { onDone } = renderSplash()
    expect(screen.getByText('Mindscape')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onDone).toHaveBeenCalled()
  })

  it('auto-dismisses after its timer', async () => {
    const { onDone } = renderSplash()
    await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 3000 })
  })
})
