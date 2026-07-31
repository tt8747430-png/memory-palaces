import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  expectKeyboard,
  keyboardHeight,
  keyboardIsMeasured,
  REVEAL_GAP,
  startKeyboardViewport,
  subscribeKeyboardHeight,
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
    subscribed: (type: string) => (listeners.get(type)?.size ?? 0) > 0,
  }
}

const inset = () => document.documentElement.style.getPropertyValue('--kb-inset')

const shell = () => document.documentElement.style.getPropertyValue('--app-height')

const range = () => document.documentElement.style.getPropertyValue('--kb-range')

/**
 * Where this UA puts the layout origin in rect coordinates: `0` when it reports rects
 * layout-relative, `-(pan)` when it reports them against the visual viewport. The only reason the
 * app still cares is that `visibleBottom()` has to name the same place in both.
 */
function stubOrigin(top: number) {
  Object.defineProperty(document.documentElement, 'getBoundingClientRect', {
    value: () => ({ top }) as DOMRect,
    configurable: true,
  })
}

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
  })

  it('measures the keyboard again once the pinch-zoom is released', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113, scale: 2 })
    await viewport.move({ height: 412, offsetTop: 113 })

    expect(keyboardHeight()).toBe(277)
  })

  it('holds the last unzoomed measurement while the user zooms mid-keyboard', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113 })
    await viewport.move({ height: 220, offsetTop: 300, scale: 3 })

    expect(keyboardHeight()).toBe(277)
  })

  it('accounts for every pixel of the anchored shell', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 412, offsetTop: 113 })

    // The pan is not published any more, but it is still part of the measurement: pan + visible
    // viewport + keyboard is the whole anchored shell, or the inset is wrong.
    const total = 113 + 412 + parseInt(inset())
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

  it('measures a keyboard the pan has left less than an accessory bar of', async () => {
    // The device reading (iOS 26, standalone): a 403px keyboard under a 289px pan leaves 114px of
    // the shell covered. Thresholding *that* rejects the keyboard outright — and since the reserve
    // only ends at a measurement, the app then runs the whole keyboard on the remembered height.
    localStorage.setItem(STORAGE_KEY, '462')
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()
    expectKeyboard(true)
    expect(keyboardIsMeasured()).toBe(false)

    await viewport.move({ height: 390, offsetTop: 289 })

    expect(keyboardIsMeasured()).toBe(true)
    expect(keyboardHeight()).toBe(114)
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(true)
  })

  it('puts the reveal band on the screen edge under that pan, not a keyboard above it', async () => {
    localStorage.setItem(STORAGE_KEY, '462')
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()
    expectKeyboard(true)

    await viewport.move({ height: 390, offsetTop: 289 })
    stubOrigin(-289)

    // The visible area *is* the visual viewport once the rects carry the pan. On the reserve this
    // read 42 — 348px above the screen — so the reveal lifted every field clean off the top and iOS
    // kept panning to reveal what the app had just scrolled away.
    expect(visibleBottom()).toBe(390)
  })

  it('keeps the document marked when the pan leaves nothing of the keyboard to cover', async () => {
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()

    await viewport.move({ height: 390, offsetTop: 403 })

    // Nothing of the shell is covered, but a keyboard is still on screen: the footer dock must stay
    // `static` and the nav hidden, or WebKit floats them across the middle of the keyboard.
    expect(keyboardHeight()).toBe(0)
    expect(keyboardIsMeasured()).toBe(true)
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(true)
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

  it('gives the space back when the keyboard is dismissed under a field that keeps focus', async () => {
    localStorage.setItem(STORAGE_KEY, '336')
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    expectKeyboard(true)
    await viewport.move({ height: 466, offsetTop: 0 })
    expect(keyboardHeight()).toBe(336)

    // The iOS swipe-down (or `Done` on the accessory bar) closes the keyboard without blurring, so
    // nothing tells the app to stop expecting one. Re-reserving the remembered height here leaves a
    // keyboard-shaped hole under the page for as long as the field holds focus.
    await viewport.move({ height: 802, offsetTop: 0 })

    expect(keyboardHeight()).toBe(0)
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)
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

  it('remembers the keyboard, not the part of it the pan left in the layout viewport', async () => {
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()

    // The reserve stands in for a keyboard measured before iOS has panned anything, so a keyboard
    // only ever seen under a pan must still be remembered at its full height.
    await viewport.move({ height: 390, offsetTop: 289 })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('403')
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

  it('keeps the measured keyboard through a scroll, so bottom chrome cannot jump', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })
    expect(keyboardHeight()).toBe(277)

    await viewport.slide({ height: 380, offsetTop: 64 })

    expect(keyboardHeight()).toBe(277)
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(true)
  })

  it('never subscribes to a visualViewport scroll at all', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    await viewport.move({ height: 412, offsetTop: 113 })
    const listener = vi.fn()
    const unsubscribe = subscribeKeyboardHeight(listener)

    // Every fault this module has had came from reading a frame of a rubber-band: the height read
    // mid-flight resizes the scroll range under the finger, the pan read mid-flight moved chrome
    // with it. Nothing positions itself from the pan now, so there is nothing to listen for.
    await viewport.slide({ height: 300, offsetTop: 300 })

    expect(viewport.subscribed('scroll')).toBe(false)
    expect(inset()).toBe('277px')
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
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

  it('wakes subscribers on a keyboard that measured exactly what was reserved', async () => {
    localStorage.setItem(STORAGE_KEY, '290')
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()
    expectKeyboard(true)
    const listener = vi.fn()
    const unsubscribe = subscribeKeyboardHeight(listener)

    // The inset does not move — the reserve was right — but the pan did, and where rects carry the
    // pan that is the reveal band moving. A wake-up conditional on the inset misses it.
    await viewport.move({ height: 390, offsetTop: 113 })

    expect(inset()).toBe('290px')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('publishes range past the keyboard, not up to it, so the last field can be lifted clear', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()
    expect(range()).toBe('0px')

    await viewport.move({ height: 466, offsetTop: 0 })

    // A scroll body with only `--kb-inset` of padding cannot lift its last field off the keyboard's
    // edge — scrollTop clamps — and iOS pans the page to finish the reveal itself.
    expect(inset()).toBe('336px')
    expect(range()).toBe(`${336 + REVEAL_GAP}px`)
  })

  it('takes the range away with the keyboard', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    await viewport.move({ height: 466, offsetTop: 0 })
    await viewport.move({ height: 802, offsetTop: 0 })

    expect(range()).toBe('0px')
  })

  it('reads the visible area in whichever space the UA reports rects in', async () => {
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()

    // Rects layout-relative: the visible area ends where the keyboard starts.
    stubOrigin(0)
    await viewport.move({ height: 390, offsetTop: 113 })
    expect(visibleBottom()).toBe(793 - 290)

    // Same geometry reported against the visual viewport: the pan is already in the rects, so the
    // visible area is exactly the visual viewport. Subtracting it twice parks fields under the
    // keyboard, which is what provokes the pan in the first place.
    stubOrigin(-113)
    expect(visibleBottom()).toBe(390)
  })

  it('clears every variable on stop so a keyboardless surface is not left padded', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    startKeyboardViewport()()

    expect(inset()).toBe('')
    expect(range()).toBe('')
    expect(shell()).toBe('')
    expect(document.documentElement.hasAttribute('data-keyboard')).toBe(false)
    expect(keyboardHeight()).toBe(0)
  })
})
