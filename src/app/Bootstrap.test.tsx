import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const createServices = vi.fn()

vi.mock('./composition-root', () => ({ createServices: () => createServices() }))
vi.mock('./App', () => ({ App: () => <div data-testid="app" /> }))
vi.mock('@/widgets/splash', () => ({
  SplashOverlay: ({ onDone }: { onDone: () => void }) => (
    <div data-testid="splash">
      <button type="button" onClick={onDone}>
        finish animation
      </button>
    </div>
  ),
}))

/** A fresh module registry per case: `Bootstrap` memoises the services promise at module scope so
 *  StrictMode's double mount cannot open the database twice. */
async function renderBootstrap() {
  vi.resetModules()
  const { Bootstrap } = await import('./Bootstrap')
  return render(<Bootstrap />)
}

const finishAnimation = () =>
  userEvent.click(screen.getByRole('button', { name: 'finish animation' }))

afterEach(() => {
  cleanup()
  createServices.mockReset()
})

describe('Bootstrap', () => {
  it('paints the splash and no app while services are still being built', async () => {
    createServices.mockReturnValue(new Promise(() => {}))

    await renderBootstrap()

    expect(screen.getByTestId('splash')).toBeInTheDocument()
    expect(screen.queryByTestId('app')).not.toBeInTheDocument()
  })

  it('mounts the app once services resolve, and lifts the splash only after its animation', async () => {
    createServices.mockResolvedValue({})

    await renderBootstrap()
    await screen.findByTestId('app')

    // Services are ready but the animation is not: the splash stays, so a fast device does not flash.
    expect(screen.getByTestId('splash')).toBeInTheDocument()

    await finishAnimation()

    await waitFor(() => expect(screen.queryByTestId('splash')).not.toBeInTheDocument())
    expect(screen.getByTestId('app')).toBeInTheDocument()
  })

  it('keeps the splash up when the animation finishes first and services are still pending', async () => {
    createServices.mockReturnValue(new Promise(() => {}))

    await renderBootstrap()
    await finishAnimation()

    expect(screen.getByTestId('splash')).toBeInTheDocument()
    expect(screen.queryByTestId('app')).not.toBeInTheDocument()
  })

  it('shows a terminal error screen with a reload action when services cannot be built', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    createServices.mockRejectedValue(new Error('IndexedDB unavailable'))

    await renderBootstrap()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Mindscape could not start')
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId('splash')).not.toBeInTheDocument())
    expect(screen.queryByTestId('app')).not.toBeInTheDocument()
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})
