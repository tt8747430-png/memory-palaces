import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Trash2 } from 'lucide-react'
import { SwipeRow } from './SwipeRow'

/**
 * Reduced motion, so the row settles in the same frame the gesture ends and the assertions are
 * about where the row went rather than about how many frames jsdom got around to running. Which
 * release springs and which jumps is `gesture-hold.test.tsx`'s question; this file's is whether the
 * row ends up back at rest at all.
 */
beforeEach(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: media.includes('prefers-reduced-motion'),
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})

const trailing = (onAction: () => void) => [
  { id: 'delete', icon: <Trash2 aria-hidden />, label: 'Delete', accent: 'red' as const, onAction },
]

function Row({ name, onAction }: { name: string; onAction: () => void }) {
  return (
    <SwipeRow trailing={trailing(onAction)}>
      <div data-testid={name}>{name}</div>
    </SwipeRow>
  )
}

/** The element `useDrag` is bound to — the one that carries the row's travel. */
const sledOf = (name: string) => screen.getByTestId(name).parentElement as HTMLElement

/**
 * `pointerType` is load-bearing: `@use-gesture` picks its axis-intent threshold by pointer type,
 * and jsdom's default empty string finds none — the gesture stays blocked and the handler is never
 * called, so a test without it passes for the wrong reason. Every touch here is a finger.
 */
const finger = (pointerId: number) => ({ pointerId, pointerType: 'touch', isPrimary: true })

function touch(name: string, pointerId = 1) {
  fireEvent.pointerDown(sledOf(name), {
    ...finger(pointerId),
    buttons: 1,
    clientX: 300,
    clientY: 10,
  })
}

function swipe(name: string, to: number, end: 'up' | 'cancel' = 'up') {
  const sled = sledOf(name)
  const pointer = finger(1)
  fireEvent.pointerDown(sled, { ...pointer, buttons: 1, clientX: 300, clientY: 10 })
  fireEvent.pointerMove(sled, { ...pointer, buttons: 1, clientX: to, clientY: 10 })
  const lift = { ...pointer, buttons: 0, clientX: to, clientY: 10 }
  if (end === 'cancel') fireEvent.pointerCancel(sled, lift)
  else fireEvent.pointerUp(sled, lift)
}

/**
 * `motion` writes a motion value to the DOM on its own frame, so every reading of the row's travel
 * is taken after one.
 */
const painted = () => act(async () => void (await new Promise(requestAnimationFrame)))

/** `motion` clears the property outright at rest, so `none` is the row back where it started. */
const AT_REST = 'none'

const displacement = (name: string) => sledOf(name).style.transform

describe('SwipeRow', () => {
  it('fires the edge action on a swipe past the commit point', () => {
    const onAction = vi.fn()
    render(<Row name="a" onAction={onAction} />)
    swipe('a', 60)
    expect(onAction).toHaveBeenCalledOnce()
  })

  /**
   * `@use-gesture` routes a cancel through the same release path as a lift, so without asking which
   * event ended the gesture a scroll takeover, an incoming call or the app going to the background
   * deletes whatever the finger happened to be over.
   */
  it('fires nothing when the platform cancels the gesture', () => {
    const onAction = vi.fn()
    render(<Row name="a" onAction={onAction} />)
    swipe('a', 60, 'cancel')
    expect(onAction).not.toHaveBeenCalled()
  })

  /**
   * The open row is put back by the touch that starts on another row, before that row moves —
   * two rows springing at once is the flicker, and the second one is already under the finger.
   */
  it('puts an open row back the moment another row takes the touch', async () => {
    render(
      <>
        <Row name="a" onAction={vi.fn()} />
        <Row name="b" onAction={vi.fn()} />
      </>,
    )
    swipe('a', 260)
    await painted()
    expect(displacement('a')).toContain('translateX(-60px)')

    touch('b', 2)
    await painted()
    expect(displacement('a')).toBe(AT_REST)
  })

  it('puts an open row back when the learner taps away from it', async () => {
    render(
      <>
        <Row name="a" onAction={vi.fn()} />
        <div data-testid="elsewhere">elsewhere</div>
      </>,
    )
    swipe('a', 260)
    await painted()
    expect(displacement('a')).toContain('translateX(-60px)')

    fireEvent.pointerDown(screen.getByTestId('elsewhere'), { ...finger(2), buttons: 1 })
    await painted()
    expect(displacement('a')).toBe(AT_REST)
  })

  /**
   * The guard against the click a drag leaves behind belongs to that drag. Left standing it is the
   * next honest tap on the row that gets swallowed — and a locked axis means the drag engine
   * reports nothing at all for that tap, so the guard cannot be cleared from inside the gesture.
   */
  it('lets the next tap through after a swipe that clicked nothing', async () => {
    const onTap = vi.fn()
    render(
      <SwipeRow trailing={trailing(vi.fn())}>
        <button type="button" data-testid="a" onClick={onTap}>
          Open
        </button>
      </SwipeRow>,
    )
    // Short enough to settle closed, so what the next tap meets is the guard and not an open tray.
    swipe('a', 285)
    await painted()

    touch('a', 2)
    fireEvent.pointerUp(sledOf('a'), { ...finger(2), buttons: 0, clientX: 300, clientY: 10 })
    fireEvent.click(screen.getByTestId('a'))
    expect(onTap).toHaveBeenCalledOnce()
  })

  it('swallows the click a committed swipe leaves behind', async () => {
    const onTap = vi.fn()
    render(
      <SwipeRow trailing={trailing(vi.fn())}>
        <button type="button" data-testid="a" onClick={onTap}>
          Open
        </button>
      </SwipeRow>,
    )
    swipe('a', 285)
    await painted()
    fireEvent.click(screen.getByTestId('a'))
    expect(onTap).not.toHaveBeenCalled()
  })
})
