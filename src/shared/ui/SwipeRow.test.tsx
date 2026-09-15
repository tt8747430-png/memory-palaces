import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Trash2 } from 'lucide-react'
import { SwipeRow } from './SwipeRow'

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

const sledOf = (name: string) => screen.getByTestId(name).parentElement as HTMLElement

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

const painted = () => act(async () => void (await new Promise(requestAnimationFrame)))

const AT_REST = 'none'

const displacement = (name: string) => sledOf(name).style.transform

describe('SwipeRow', () => {
  it('fires the edge action on a swipe past the commit point', () => {
    const onAction = vi.fn()
    render(<Row name="a" onAction={onAction} />)
    swipe('a', 60)
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('fires nothing when the platform cancels the gesture', () => {
    const onAction = vi.fn()
    render(<Row name="a" onAction={onAction} />)
    swipe('a', 60, 'cancel')
    expect(onAction).not.toHaveBeenCalled()
  })

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

  it('lets the next tap through after a swipe that clicked nothing', async () => {
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
