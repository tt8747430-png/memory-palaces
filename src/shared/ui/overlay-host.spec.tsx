import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverlayHost, openOverlay, useOverlayController } from './overlay-host'

describe('openOverlay', () => {
  it('mounts a node and resolves the promise with the value it passes back', async () => {
    render(<OverlayHost />)
    const promise = openOverlay<string>((resolve) => (
      <button onClick={() => resolve('picked')}>choose</button>
    ))
    await userEvent.click(await screen.findByText('choose'))
    await expect(promise).resolves.toBe('picked')
    expect(screen.queryByText('choose')).not.toBeInTheDocument() // unmounts on resolve
  })
})

function ControllerHarness({ resolve }: { resolve: (value: string) => void }) {
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)
  return (
    <div>
      <span data-testid="open">{String(open)}</span>
      <button onClick={() => close('first')}>close-first</button>
      <button onClick={() => close('second')}>close-second</button>
      <button onClick={() => onOpenChangeComplete(false)}>complete-close</button>
      <button onClick={() => onOpenChangeComplete(true)}>complete-open</button>
    </div>
  )
}

describe('useOverlayController', () => {
  it('starts open, and flips open to false on close without resolving until the close transition completes', async () => {
    const resolve = vi.fn()
    render(<ControllerHarness resolve={resolve} />)

    expect(screen.getByTestId('open')).toHaveTextContent('true')

    await userEvent.click(screen.getByText('close-first'))
    expect(screen.getByTestId('open')).toHaveTextContent('false')
    expect(resolve).not.toHaveBeenCalled()

    await userEvent.click(screen.getByText('complete-close'))
    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve).toHaveBeenCalledWith('first')
  })

  it('resolves a value exactly once, ignoring a second close and a repeated completion', async () => {
    const resolve = vi.fn()
    render(<ControllerHarness resolve={resolve} />)

    await userEvent.click(screen.getByText('close-first'))
    await userEvent.click(screen.getByText('close-second')) // already closing — ignored
    await userEvent.click(screen.getByText('complete-close'))
    await userEvent.click(screen.getByText('complete-close')) // already resolved — ignored

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve).toHaveBeenCalledWith('first')
  })

  it('ignores onOpenChangeComplete(true) — the open-transition completion is not a close', async () => {
    const resolve = vi.fn()
    render(<ControllerHarness resolve={resolve} />)

    await userEvent.click(screen.getByText('complete-open'))
    expect(resolve).not.toHaveBeenCalled()
  })
})
