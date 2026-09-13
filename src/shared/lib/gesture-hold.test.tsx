import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReleaseReason, useGestureHold } from './gesture-hold'

afterEach(cleanup)

function Surface({
  name,
  onRelease,
  surface = true,
}: {
  name: string
  onRelease: (reason: ReleaseReason) => void
  surface?: boolean
}) {
  const { surface: bundle, hold, drop } = useGestureHold(onRelease)
  // A surface that declines the mark is not a thing the hook can produce — it is what every other
  // element on the page is, and the registry has to tell a touch on one from a takeover.
  const marked = surface ? bundle : { ref: bundle.ref }
  return (
    <div data-testid={name} {...marked} onPointerDown={() => hold()}>
      <button type="button" onClick={drop}>
        {`drop ${name}`}
      </button>
    </div>
  )
}

describe('useGestureHold', () => {
  it('releases the surface that was holding when another one claims', async () => {
    const user = userEvent.setup()
    const first = vi.fn()
    const second = vi.fn()
    render(
      <>
        <Surface name="a" onRelease={first} />
        <Surface name="b" onRelease={second} />
      </>,
    )

    await user.pointer({ target: screen.getByTestId('a'), keys: '[MouseLeft>]' })
    expect(first).not.toHaveBeenCalled()

    await user.pointer({ target: screen.getByTestId('b'), keys: '[MouseLeft>]' })
    expect(first).toHaveBeenCalledWith('claimed')
    expect(second).not.toHaveBeenCalled()
  })

  /**
   * The reason is the whole point of the registry: a row taken over jumps back, because the surface
   * taking it over is already moving under the same finger and a spring here is the second thing
   * moving. A row simply put down springs.
   */
  it('calls a touch on empty space a release, not a claim', async () => {
    const user = userEvent.setup()
    const onRelease = vi.fn()
    render(
      <>
        <Surface name="a" onRelease={onRelease} />
        <div data-testid="elsewhere">elsewhere</div>
      </>,
    )

    await user.pointer({ target: screen.getByTestId('a'), keys: '[MouseLeft>]' })
    await user.pointer({ target: screen.getByTestId('elsewhere'), keys: '[MouseLeft>]' })
    expect(onRelease).toHaveBeenCalledWith('outside')
  })

  it('leaves the holder alone while the touch stays inside it', async () => {
    const user = userEvent.setup()
    const onRelease = vi.fn()
    render(<Surface name="a" onRelease={onRelease} />)

    const surface = screen.getByTestId('a')
    await user.pointer({ target: surface, keys: '[MouseLeft>]' })
    await user.pointer({ target: screen.getByRole('button'), keys: '[MouseLeft>]' })
    expect(onRelease).not.toHaveBeenCalled()
  })

  it('stops watching once the holder has given the claim up itself', async () => {
    const user = userEvent.setup()
    const onRelease = vi.fn()
    render(
      <>
        <Surface name="a" onRelease={onRelease} />
        <div data-testid="elsewhere">elsewhere</div>
      </>,
    )

    await user.pointer({ target: screen.getByTestId('a'), keys: '[MouseLeft>]' })
    await user.click(screen.getByRole('button', { name: 'drop a' }))
    await user.pointer({ target: screen.getByTestId('elsewhere'), keys: '[MouseLeft>]' })
    expect(onRelease).not.toHaveBeenCalled()
  })

  // A surface that has gone owns nothing, and its release would set state on a dead component.
  it('gives the claim up when the holder unmounts', async () => {
    const user = userEvent.setup()
    const onRelease = vi.fn()
    const { unmount } = render(<Surface name="a" onRelease={onRelease} />)

    await user.pointer({ target: screen.getByTestId('a'), keys: '[MouseLeft>]' })
    unmount()
    render(<div data-testid="elsewhere">elsewhere</div>)
    await user.pointer({ target: screen.getByTestId('elsewhere'), keys: '[MouseLeft>]' })
    expect(onRelease).not.toHaveBeenCalled()
  })
})
