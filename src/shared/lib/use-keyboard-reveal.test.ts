import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { startKeyboardViewport } from './keyboard-viewport'
import { revealOffset, useKeyboardReveal } from './use-keyboard-reveal'

const STORAGE_KEY = 'mindscape.keyboard-height'

const band = (top: number, bottom: number) => ({ top, bottom })

describe('revealOffset', () => {
  it('leaves a field that already sits clear of the keyboard alone', () => {
    expect(revealOffset(band(0, 500), band(200, 240))).toBe(0)
  })

  it('scrolls a field out from behind the keyboard, with breathing room', () => {
    expect(revealOffset(band(0, 500), band(460, 510))).toBe(34)
  })

  it('aligns the top of a field taller than the visible band', () => {
    expect(revealOffset(band(0, 300), band(100, 800))).toBe(76)
  })

  it('scrolls back down for a field stranded above the band', () => {
    expect(revealOffset(band(100, 500), band(40, 90))).toBe(-84)
  })
})

interface Viewport {
  height: number
  offsetTop: number
}

function stubViewport({ height, offsetTop }: Viewport, layoutHeight: number) {
  const listeners = new Set<() => void>()
  const vv = {
    height,
    offsetTop,
    // Unzoomed — keyboard-viewport suspends measuring while scale !== 1.
    scale: 1,
    addEventListener: (_type: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_type: string, fn: () => void) => listeners.delete(fn),
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
    async move(next: Viewport & { layoutHeight?: number }) {
      vv.height = next.height
      vv.offsetTop = next.offsetTop
      if (next.layoutHeight !== undefined) layout.height = next.layoutHeight
      listeners.forEach((fn) => fn())
      await new Promise((resolve) => requestAnimationFrame(resolve))
    },
  }
}

function stubRect(node: Element, top: number, bottom: number) {
  node.getBoundingClientRect = () => ({ top, bottom, height: bottom - top }) as DOMRect
}

/**
 * Which coordinate space this simulated platform reports rects in — where `keyboard-viewport` finds
 * the layout origin. `-pan` is a UA whose rects already carry the pan; `0` is one whose rects are
 * layout-relative. (The fixed probe it measures alongside stays at jsdom's 0, so the shell reads as
 * left at the layout origin in both.)
 */
function stubRectSpace(htmlTop: number) {
  stubRect(document.documentElement, htmlTop, htmlTop)
}

const inset = () => document.documentElement.style.getPropertyValue('--kb-inset')

let stop: (() => void) | undefined

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  stop?.()
  stop = undefined
  document.body.replaceChildren()
  Reflect.deleteProperty(window, 'visualViewport')
  Reflect.deleteProperty(document.documentElement, 'clientHeight')
  Reflect.deleteProperty(document.documentElement, 'clientWidth')
  Reflect.deleteProperty(document.documentElement, 'getBoundingClientRect')
})

describe('useKeyboardReveal', () => {
  it('reserves the remembered keyboard height the moment a field takes focus', () => {
    localStorage.setItem(STORAGE_KEY, '336')
    stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    document.body.appendChild(scroll)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))

    act(() => field.focus())
    expect(inset()).toBe('336px')

    act(() => field.blur())
    expect(inset()).toBe('0px')
  })

  it('reserves nothing for a control that opens no keyboard', () => {
    localStorage.setItem(STORAGE_KEY, '336')
    stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const button = document.createElement('button')
    scroll.appendChild(button)
    document.body.appendChild(scroll)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))

    act(() => button.focus())

    expect(inset()).toBe('0px')
  })

  it('lifts a field that the keyboard would cover, before the keyboard reports itself', () => {
    localStorage.setItem(STORAGE_KEY, '300')
    stubViewport({ height: 800, offsetTop: 0 }, 800)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    document.body.appendChild(scroll)

    Object.defineProperty(scroll, 'scrollTop', { value: 0, writable: true })
    stubRect(scroll, 64, 800)
    stubRect(field, 460, 500)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))
    act(() => field.focus())

    expect(scroll.scrollTop).toBe(24)
  })

  it('measures the band against the anchored shell, not the shrunken layout viewport', async () => {
    localStorage.setItem(STORAGE_KEY, '200')
    const viewport = stubViewport({ height: 800, offsetTop: 0 }, 800)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    document.body.appendChild(scroll)

    Object.defineProperty(scroll, 'scrollTop', { value: 0, writable: true })
    stubRect(scroll, 64, 800)
    stubRect(field, 460, 500)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))
    act(() => field.focus())

    await act(async () => {
      await viewport.move({ height: 500, offsetTop: 0, layoutHeight: 500 })
    })

    expect(inset()).toBe('300px')
    expect(scroll.scrollTop).toBe(24)
  })

  it('keeps the field clear of the header', () => {
    localStorage.setItem(STORAGE_KEY, '300')
    stubViewport({ height: 800, offsetTop: 0 }, 800)
    stop = startKeyboardViewport()

    const shell = document.createElement('div')
    const header = document.createElement('header')
    header.dataset.slot = 'header-bar'
    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    shell.append(header, scroll)
    document.body.appendChild(shell)

    Object.defineProperty(scroll, 'scrollTop', { value: 0, writable: true })
    stubRect(scroll, 0, 800)
    stubRect(header, 0, 108)
    stubRect(field, 90, 130)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))
    act(() => field.focus())

    expect(scroll.scrollTop).toBe(-42)
  })

  it('subtracts the pan from the band where rects already carry it', async () => {
    localStorage.setItem(STORAGE_KEY, '290')
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    document.body.appendChild(scroll)

    Object.defineProperty(scroll, 'scrollTop', { value: 0, writable: true })
    stubRect(scroll, 0, 793)
    stubRect(field, 360, 400)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))
    act(() => field.focus())
    expect(scroll.scrollTop).toBe(0)

    // The pan arrives with the keyboard, and this UA reports rects against the visual viewport, so
    // the layout origin moves with it.
    stubRectSpace(-113)
    await act(async () => {
      await viewport.move({ height: 390, offsetTop: 113 })
    })

    // Visible area is now 390 tall, not 503: a field at 400 sits under the keyboard.
    expect(scroll.scrollTop).toBe(34)
  })

  it('leaves the pan out of the band where rects are layout-relative', async () => {
    localStorage.setItem(STORAGE_KEY, '290')
    stubRectSpace(0)
    const viewport = stubViewport({ height: 793, offsetTop: 0 }, 793)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    document.body.appendChild(scroll)

    Object.defineProperty(scroll, 'scrollTop', { value: 0, writable: true })
    stubRect(scroll, 0, 793)
    stubRect(field, 360, 400)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))
    act(() => field.focus())

    await act(async () => {
      await viewport.move({ height: 390, offsetTop: 113 })
    })

    // The same geometry, read in the other space: the pan is not in the rects, so the visible area
    // ends at 503 and a field at 400 is already clear. Subtracting it here would scroll the field
    // 113px further than the keyboard ever required.
    expect(scroll.scrollTop).toBe(0)
  })

  it('stops reserving when the scroll surface unmounts', () => {
    localStorage.setItem(STORAGE_KEY, '336')
    stubViewport({ height: 802, offsetTop: 0 }, 802)
    stop = startKeyboardViewport()

    const scroll = document.createElement('div')
    const field = document.createElement('input')
    scroll.appendChild(field)
    document.body.appendChild(scroll)

    const { result } = renderHook(() => useKeyboardReveal())
    act(() => result.current(scroll))
    act(() => field.focus())

    act(() => result.current(null))

    expect(inset()).toBe('0px')
  })
})
