import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  expectKeyboard,
  isPanBakedIntoRects,
  keyboardHeight,
  startKeyboardViewport,
  subscribeKeyboardHeight,
  subscribePan,
  visibleBottom,
} from './keyboard-viewport'

const STORAGE_KEY = 'mindscape.keyboard-height'

interface Viewport {
  height: number
  offsetTop: number
  scale?: number
}

function stubViewport({ height, offsetTop, scale = 1 }: Viewport, layoutHeight: number) {
  const listeners = new Map<string, Set<() => void>>()
  const vv = {
    height,
    offsetTop,
    scale,
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

  const settle = async (
    next: Viewport & { layoutHeight?: number; width?: number },
    type: string,
  ) => {
    vv.height = next.height
    vv.offsetTop = next.offsetTop
    vv.scale = next.scale ?? 1
    if (next.layoutHeight !== undefined) layout.height = next.layoutHeight
    if (next.width !== undefined) layout.width = next.width
    listeners.get(type)?.forEach((fn) => fn())
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }

  return {
    /** The viewport changed size — the keyboard opened, closed or resized. */
    move: (next: Viewport & { layoutHeight?: number; width?: number }) => settle(next, 'resize'),
    /** The viewport slid without resizing — the page scrolled under it. */
    slide: (next: Viewport) => settle(next, 'scroll'),
  }
}

const inset = () => document.documentElement.style.getPropertyValue('--kb-inset')

const shell = () => document.documentElement.style.getPropertyValue('--app-height')

const panOffset = () => document.documentElement.style.getPropertyValue('--vv-top')

const panComp = () => document.documentElement.style.getPropertyValue('--pan-comp')

/**
 * What `getBoundingClientRect()` reports for `html`. A UA that re-anchors fixed boxes to the visual
 * viewport puts it at -(pan); one that does not leaves it at 0 and rides the shell off the screen.
 */
function stubHtmlRectTop(top: number) {
  Object.defineProperty(document.documentElement, 'getBoundingClientRect', {
    value: () => ({ top }) as DOMRect,
    configurable: true,
  })
}

/** Longer than the pan's settle window, so a slide has been given its chance to publish. */
const afterSettle = () => new Promise((resolve) => setTimeout(resolve, 220))

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
  Reflect.deleteProperty(document.documentElement, 'getBoundingClientRect')
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

  it('does not read a pinch-zoom as a keyboard', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    // Same geometry a 390px keyboard would produce, but the viewport is zoomed.
    await viewport.move({ height: 412, offsetTop: 113, scale: 2 })

    expect(inset()).toBe('0px')
    expect(keyboardHeight()).toBe(0)
    expect(panOffset()).toBe('0px')
  })

  it('measures the keyboard again once the pinch-zoom is released', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113, scale: 2 })
    await viewport.move({ height: 412, offsetTop: 113 })

    expect(keyboardHeight()).toBe(277)
    expect(panOffset()).toBe('113px')
  })

  it('holds the last unzoomed measurement while the user zooms mid-keyboard', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113 })
    await viewport.move({ height: 220, offsetTop: 300, scale: 3 })

    expect(keyboardHeight()).toBe(277)
    expect(panOffset()).toBe('113px')
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

  it('holds the reserve only until the keyboard reports itself', () => {
    localStorage.setItem(STORAGE_KEY, '336')
    stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expectKeyboard(true)

    expect(keyboardHeight()).toBe(336)
  })

  it('publishes a measurement smaller than the remembered one instead of clamping to it', async () => {
    localStorage.setItem(STORAGE_KEY, '336')
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    expectKeyboard(true)

    await viewport.move({ height: 466, offsetTop: 150 })

    expect(keyboardHeight()).toBe(186)
  })

  it('remembers the largest measurement, so the reserve is never short of a full keyboard', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 466, offsetTop: 0 })
    await viewport.move({ height: 466, offsetTop: 150 })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('336')
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

  it('holds the pan still while the page scrolls under a raised keyboard', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })
    expect(panOffset()).toBe('113px')

    // iOS slides the visual viewport back as the page rubber-bands.
    await viewport.slide({ height: 412, offsetTop: 64 })

    expect(panOffset()).toBe('113px')
  })

  it('keeps the measured keyboard through a scroll, so bottom chrome cannot jump', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })
    expect(keyboardHeight()).toBe(277)

    await viewport.slide({ height: 380, offsetTop: 64 })

    expect(keyboardHeight()).toBe(277)
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(true)
  })

  it('releases the pan once the keyboard goes away', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })
    await viewport.slide({ height: 412, offsetTop: 64 })

    await viewport.move({ height: 802, offsetTop: 0 })

    expect(panOffset()).toBe('0px')
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)
  })

  it('notifies subscribers when the height changes', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    const listener = vi.fn()
    const unsubscribe = subscribeKeyboardHeight(listener)

    await viewport.move({ height: 466, offsetTop: 0 })

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('leaves the pan where it was while the viewport slides under a drag', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })

    // iOS slides the visual viewport frame by frame as the page rubber-bands. Chrome positioned
    // from those frames follows the finger down the screen.
    await viewport.slide({ height: 412, offsetTop: 150 })
    await viewport.slide({ height: 412, offsetTop: 64 })
    await viewport.slide({ height: 412, offsetTop: 113 })

    expect(panOffset()).toBe('113px')
  })

  it('publishes the pan once the viewport has stopped sliding', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })

    // Focus moved to a lower field: iOS re-pans without ever resizing.
    await viewport.slide({ height: 412, offsetTop: 200 })
    expect(panOffset()).toBe('113px')

    await afterSettle()

    expect(panOffset()).toBe('200px')
  })

  it('lets the pan come back down, so chrome is not left hanging below the top', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 200 })
    expect(panOffset()).toBe('200px')

    await viewport.move({ height: 412, offsetTop: 113 })

    expect(panOffset()).toBe('113px')
  })

  it('does not tell height subscribers about a pan', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })

    const onHeight = vi.fn()
    const onPan = vi.fn()
    const stopHeight = subscribeKeyboardHeight(onHeight)
    const stopPan = subscribePan(onPan)

    await viewport.slide({ height: 412, offsetTop: 200 })
    await afterSettle()

    expect(onHeight).not.toHaveBeenCalled()
    expect(onPan).toHaveBeenCalledTimes(1)
    stopHeight()
    stopPan()
  })

  it('compensates the pan where the platform leaves the shell off the screen', async () => {
    stubHtmlRectTop(0)
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113 })

    expect(isPanBakedIntoRects()).toBe(false)
    expect(panComp()).toBe('113px')
    // Rects are layout-relative, so the visible area ends where the keyboard starts.
    expect(visibleBottom()).toBe(802 - 277)
  })

  it('publishes no compensation where the UA re-anchored the shell itself', async () => {
    stubHtmlRectTop(-113)
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113 })

    expect(isPanBakedIntoRects()).toBe(true)
    expect(panComp()).toBe('0px')
    // Rects already carry the pan, so the visible area is exactly the visual viewport.
    expect(visibleBottom()).toBe(412)
  })

  it('clears both variables on stop so a keyboardless surface is not left offset', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    startKeyboardViewport()()

    expect(inset()).toBe('')
    expect(shell()).toBe('')
    expect(panOffset()).toBe('')
    expect(panComp()).toBe('')
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)
    expect(keyboardHeight()).toBe(0)
  })
})
