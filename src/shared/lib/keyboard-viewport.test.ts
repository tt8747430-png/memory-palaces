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
  const layout = { height: layoutHeight, width: 390 }

  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    get: () => layout.height,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientWidth', {
    get: () => layout.width,
    configurable: true,
  })

  return {
    async move(next: Viewport & { layoutHeight?: number; width?: number }) {
      vv.height = next.height
      vv.offsetTop = next.offsetTop
      if (next.layoutHeight !== undefined) layout.height = next.layoutHeight
      if (next.width !== undefined) layout.width = next.width
      listeners.get('resize')?.forEach((fn) => fn())
      await new Promise((resolve) => requestAnimationFrame(resolve))
    },
  }
}

const inset = () => document.documentElement.style.getPropertyValue('--kb-inset')

const shell = () => document.documentElement.style.getPropertyValue('--app-height')

const panOffset = () => document.documentElement.style.getPropertyValue('--vv-top')

let stop: (() => void) | undefined

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  stop?.()
  stop = undefined
  Reflect.deleteProperty(window, 'visualViewport')
  Reflect.deleteProperty(document.documentElement, 'clientHeight')
  Reflect.deleteProperty(document.documentElement, 'clientWidth')
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

  it('publishes the pan so top chrome can ride back onto the screen', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expect(panOffset()).toBe('0px')

    await viewport.move({ height: 412, offsetTop: 113 })

    expect(panOffset()).toBe('113px')
  })

  it('accounts for every pixel of the anchored shell', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113 })

    const total = parseInt(panOffset()) + 412 + parseInt(inset())
    expect(total).toBe(parseInt(shell()))
  })

  it('measures the keyboard when the platform shrinks the layout viewport instead of panning', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    expectKeyboard(true)

    await viewport.move({ height: 466, offsetTop: 0, layoutHeight: 466 })

    expect(shell()).toBe('802px')
    expect(keyboardHeight()).toBe(336)
  })

  it('holds the shell at full height while a field is focused, so nothing reflows', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    expect(shell()).toBe('802px')

    expectKeyboard(true)
    await viewport.move({ height: 466, offsetTop: 0, layoutHeight: 466 })
    expect(shell()).toBe('802px')

    expectKeyboard(false)
    await viewport.move({ height: 802, offsetTop: 0, layoutHeight: 802 })
    expect(shell()).toBe('802px')
  })

  it('re-anchors the shell on rotation', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 390, offsetTop: 0, layoutHeight: 390, width: 802 })

    expect(shell()).toBe('390px')
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

  it('marks the document while the keyboard is up so footer docks can unstick', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)

    await viewport.move({ height: 466, offsetTop: 0 })
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(true)

    await viewport.move({ height: 802, offsetTop: 0 })
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)
  })

  it('marks the document as soon as a focus reserves the remembered height', () => {
    localStorage.setItem(STORAGE_KEY, '336')
    stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expectKeyboard(true)

    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(true)
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

  it('clears both variables on stop so a keyboardless surface is not left offset', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    startKeyboardViewport()()

    expect(inset()).toBe('')
    expect(shell()).toBe('')
    expect(panOffset()).toBe('')
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)
    expect(keyboardHeight()).toBe(0)
  })
})
