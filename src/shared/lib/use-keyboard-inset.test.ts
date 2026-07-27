import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useKeyboardInset } from './use-keyboard-inset'

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
      await act(async () => {
        listeners.get('resize')?.forEach((fn) => fn())
        await new Promise((resolve) => requestAnimationFrame(resolve))
      })
    },
  }
}

const read = () => ({
  top: document.documentElement.style.getPropertyValue('--vv-top'),
  height: document.documentElement.style.getPropertyValue('--vvh'),
  inset: document.documentElement.style.getPropertyValue('--kb-inset'),
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'visualViewport')
  Reflect.deleteProperty(document.documentElement, 'clientHeight')
})

describe('useKeyboardInset', () => {
  it('publishes a flush, full-height viewport when no keyboard is up', () => {
    stubViewport({ height: 800, offsetTop: 0 }, 800)

    renderHook(() => useKeyboardInset())

    expect(read()).toEqual({ top: '0px', height: '800px', inset: '0px' })
  })

  it('reports the offset iOS slides the visual viewport by to reveal a focused field', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    renderHook(() => useKeyboardInset())

    expect(read()).toEqual({ top: '113px', height: '412px', inset: '277px' })
  })

  it('accounts for every pixel of the layout viewport', async () => {
    const viewport = stubViewport({ height: 802, offsetTop: 0 }, 802)
    renderHook(() => useKeyboardInset())

    await viewport.move({ height: 412, offsetTop: 113 })

    const { top, height, inset } = read()
    expect(parseInt(top) + parseInt(height) + parseInt(inset)).toBe(802)
  })

  it('clears the variables on unmount so a non-keyboard surface is not left inset', () => {
    stubViewport({ height: 412, offsetTop: 113 }, 802)

    renderHook(() => useKeyboardInset()).unmount()

    expect(read()).toEqual({ top: '', height: '', inset: '' })
  })
})
