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
    expect(revealOffset(band(0, 500), band(460, 510))).toBe(26)
  })

  it('aligns the top of a field taller than the visible band', () => {
    expect(revealOffset(band(0, 300), band(100, 800))).toBe(84)
  })

  it('scrolls back down for a field stranded above the band', () => {
    expect(revealOffset(band(100, 500), band(40, 90))).toBe(-76)
  })
})

interface Viewport {
  height: number
  offsetTop: number
}

function stubViewport({ height, offsetTop }: Viewport, layoutHeight: number) {
  Object.defineProperty(window, 'visualViewport', {
    value: { height, offsetTop, addEventListener: () => {}, removeEventListener: () => {} },
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: layoutHeight,
    configurable: true,
  })
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
