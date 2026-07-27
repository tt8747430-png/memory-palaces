import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  expectKeyboard,
  keyboardHeight,
  startKeyboardViewport,
  subscribeKeyboard,
} from './keyboard-viewport'

const STORAGE_KEY = 'mindscape.keyboard-height'

interface Viewport {
  height: number
  offsetTop: number
}

function stubViewport({ height, offsetTop }: Viewport, layoutHeight: number) {
  const listeners = new Map<string, Set<() => void>>()
  const vv = {
    height,
    offsetTop,
    addEventListener: (type: string, fn: () => void) => {
      const set = listeners.get(type) ?? new Set()
      set.add(fn)
      listeners.set(type, set)
    },
    removeEventListener: (type: string, fn: () => void) => listeners.get(type)?.delete(fn),
  }

  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: layoutHeight,
    configurable: true,
  })

  return {
    async move(next: Viewport) {
      vv.height = next.height
      vv.offsetTop = next.offsetTop
      listeners.get('resize')?.forEach((fn) => fn())
      await new Promise((resolve) => requestAnimationFrame(resolve))
    },
  }
}

const inset = () => document.documentElement.style.getPropertyValue('--kb-inset')

let stop: (() => void) | undefined

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  stop?.()
  stop = undefined
  Reflect.deleteProperty(window, 'visualViewport')
  Reflect.deleteProperty(document.documentElement, 'clientHeight')
})

describe('keyboard viewport', () => {
  it('publishes a zero inset when no keyboard is up', () => {
    stubViewport({ height: 800, offsetTop: 0 }, 800)

    stop = startKeyboardViewport()

    expect(inset()).toBe('0px')
    expect(keyboardHeight()).toBe(0)
  })

  it('measures the keyboard even while iOS has panned the viewport', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    stop = startKeyboardViewport()

    expect(inset()).toBe('277px')
    expect(keyboardHeight()).toBe(277)
  })

  it('ignores a gap too small to be a keyboard', () => {
    stubViewport({ height: 760, offsetTop: 0 }, 800)

    stop = startKeyboardViewport()

    expect(keyboardHeight()).toBe(0)
  })

  it('remembers the measured height so the next launch can reserve room up front', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 466, offsetTop: 0 })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('336')
  })

  it('reserves the remembered height on focus, before the keyboard reports itself', async () => {
    localStorage.setItem(STORAGE_KEY, '336')
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expectKeyboard(true)
    expect(keyboardHeight()).toBe(336)

    await viewport.move({ height: 450, offsetTop: 0 })
    expect(keyboardHeight()).toBe(352)

    expectKeyboard(false)
    await viewport.move({ height: 802, offsetTop: 0 })
    expect(keyboardHeight()).toBe(0)
  })

  it('never shrinks below the reserved height while a field is still focused', () => {
    localStorage.setItem(STORAGE_KEY, '336')
    stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expectKeyboard(true)

    expect(keyboardHeight()).toBe(336)
  })

  it('notifies subscribers when the height changes', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    const listener = vi.fn()
    const unsubscribe = subscribeKeyboard(listener)

    await viewport.move({ height: 466, offsetTop: 0 })

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('clears the inset on stop so a keyboardless surface is not left padded', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    startKeyboardViewport()()

    expect(inset()).toBe('')
    expect(keyboardHeight()).toBe(0)
  })
})
