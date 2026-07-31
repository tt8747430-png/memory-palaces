import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useViewportProbe } from './viewport-sample'

/** One animation frame of the probe's sampling loop. */
const frame = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20)
  })
}

const SHELL = 793

const viewport = { height: SHELL, offsetTop: 0, scale: 1 }

const inset = (height: number) => {
  const style = document.documentElement.style
  style.setProperty('--kb-inset', `${height}px`)
  style.setProperty('--kb-range', height > 0 ? `${height + 24}px` : '0px')
  document.documentElement.toggleAttribute('data-keyboard', height > 0)
}

/** A settled keyboard: the viewport shrank by exactly what the module then published. */
const keyboard = (height: number) => {
  viewport.height = SHELL - height
  viewport.offsetTop = 0
  inset(height)
}

/**
 * The frame a keyboard is dismissed on. iOS animates it away over several frames and the module
 * re-measures behind a `requestAnimationFrame`, so the probe reads a restored viewport against the
 * inset from the frame before it — the reading that used to be sealed as the keyboard itself.
 */
const dismissing = () => {
  viewport.height = SHELL
  viewport.offsetTop = 0
}

beforeEach(() => {
  vi.useFakeTimers()
  // jsdom ships no `matchMedia`; the probe reads it only to label the display mode.
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media }))
  Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true })
  document.documentElement.style.setProperty('--app-height', `${SHELL}px`)
  keyboard(0)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'visualViewport')
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-keyboard')
})

describe('useViewportProbe keyboard history', () => {
  it('keeps nothing until a keyboard opens', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    expect(result.current.episodes()).toEqual([])
    expect(result.current.episodeCount).toBe(0)
  })

  it('pairs the keyboard with the resting reading from the frame before it', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    keyboard(403)
    await frame()

    const [episode] = result.current.episodes()
    expect(episode?.before?.kbInset).toBe('0px')
    expect(episode?.after.kbInset).toBe('403px')
    // Still on screen: `after` is whatever the last frame read, not a sealed value.
    expect(episode?.live).toBe(true)
    expect(result.current.episodeCount).toBe(1)
  })

  it('follows the open keyboard rather than freezing on the frame it appeared', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    keyboard(180)
    await frame()
    keyboard(403)
    await frame()

    expect(result.current.episodes()[0]?.after.kbInset).toBe('403px')
    expect(result.current.episodes()).toHaveLength(1)
  })

  it('seals the pair when the keyboard goes, and starts a new one on the next open', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    keyboard(403)
    await frame()
    keyboard(0)
    await frame()

    expect(result.current.episodes()).toHaveLength(1)
    expect(result.current.episodes()[0]?.live).toBe(false)

    keyboard(300)
    await frame()
    const episodes = result.current.episodes()
    expect(episodes).toHaveLength(2)
    expect(episodes[1]?.after.kbInset).toBe('300px')
    expect(episodes[1]?.before?.kbInset).toBe('0px')
  })

  it('seals the reading the keyboard settled at, not the frame it was dismissed on', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    keyboard(403)
    await frame()
    dismissing()
    await frame()
    keyboard(0)
    await frame()

    const [episode] = result.current.episodes()
    expect(episode?.after.vvHeight).toBe(390)
    expect(episode?.after.kbInset).toBe('403px')
  })

  it('keeps the last open frame when no frame ever settled, rather than dropping the keyboard', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    // An inset with no viewport movement under it: the reserve, before the keyboard reports itself.
    inset(462)
    await frame()
    inset(0)
    await frame()

    expect(result.current.episodes()).toHaveLength(1)
    expect(result.current.episodes()[0]?.after.kbInset).toBe('462px')
  })

  it('keeps only the last five keyboards', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    for (let index = 1; index <= 7; index += 1) {
      keyboard(index * 10 + 300)
      await frame()
      keyboard(0)
      await frame()
    }

    const episodes = result.current.episodes()
    expect(episodes).toHaveLength(5)
    expect(episodes[0]?.after.kbInset).toBe('330px')
    expect(episodes[4]?.after.kbInset).toBe('370px')
    expect(result.current.episodeCount).toBe(5)
  })

  it('counts the live keyboard within the five', async () => {
    const { result } = renderHook(() => useViewportProbe())
    await frame()
    for (let index = 1; index <= 5; index += 1) {
      keyboard(index * 10 + 300)
      await frame()
      keyboard(0)
      await frame()
    }
    keyboard(403)
    await frame()

    const episodes = result.current.episodes()
    expect(episodes).toHaveLength(5)
    expect(episodes[4]?.live).toBe(true)
    expect(episodes[4]?.after.kbInset).toBe('403px')
  })
})
