import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const createServices = vi.fn()

vi.mock('./composition-root', () => ({ createServices: () => createServices() }))
vi.mock('./App', () => ({ App: () => <div data-testid="app" /> }))
vi.mock('@/widgets/splash', () => ({
  SplashOverlay: ({ onIntroDone, waiting }: { onIntroDone: () => void; waiting: boolean }) => (
    <div data-testid="splash" data-waiting={waiting}>
      <button type="button" onClick={onIntroDone}>
        finish animation
      </button>
    </div>
  ),
}))

/** Fresh modules each time, so the splash store starts where a launch starts. */
async function renderBootstrap() {
  vi.resetModules()
  const [{ Bootstrap }, { useSplashStore }] = await Promise.all([
    import('./Bootstrap'),
    import('@/shared/lib'),
  ])
  return { ...render(<Bootstrap />), splash: useSplashStore }
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

  it('mounts the app once services resolve, and lifts the splash only after its animation and the session', async () => {
    createServices.mockResolvedValue({})

    const { splash } = await renderBootstrap()
    await screen.findByTestId('app')

    expect(screen.getByTestId('splash')).toBeInTheDocument()

    await finishAnimation()
    // Who is signed in is still being worked out — the app under the splash decides that.
    expect(screen.getByTestId('splash')).toBeInTheDocument()

    act(() => splash.getState().release('session'))
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

  it('brings the splash back over the open app for a first Sync, and says what it waits on', async () => {
    createServices.mockResolvedValue({})
    const { splash } = await renderBootstrap()
    await screen.findByTestId('app')
    await finishAnimation()
    act(() => splash.getState().release('session'))
    await waitFor(() => expect(screen.queryByTestId('splash')).not.toBeInTheDocument())

    act(() => splash.getState().hold('first-sync'))
    expect(screen.getByTestId('splash')).toHaveAttribute('data-waiting', 'false')
    await finishAnimation()
    expect(screen.getByTestId('splash')).toHaveAttribute('data-waiting', 'true')

    act(() => splash.getState().release('first-sync'))
    await waitFor(() => expect(screen.queryByTestId('splash')).not.toBeInTheDocument())
    expect(screen.getByTestId('app')).toBeInTheDocument()
  })
})
