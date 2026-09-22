import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readTopInset, startTopInset, TOP_INSET_MEMORY_KEY, topInsetShape } from './top-inset'

/** What `env(safe-area-inset-top)` reports: jsdom lays nothing out, so the probe's box is faked. */
let reported = 0

function installedAt(width: number, standalone = true) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: standalone && query.includes('standalone') })),
  )
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

const published = () => document.documentElement.style.getPropertyValue('--safe-top-held')
const memory = () => JSON.parse(localStorage.getItem(TOP_INSET_MEMORY_KEY) ?? '{}') as unknown

let stop: (() => void) | null = null

beforeEach(() => {
  reported = 0
  localStorage.removeItem(TOP_INSET_MEMORY_KEY)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({ height: reported }) as DOMRect,
  )
  installedAt(393)
})

afterEach(() => {
  stop?.()
  stop = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const resample = () => window.dispatchEvent(new Event('resize'))

describe('the top inset', () => {
  it('publishes what iOS reports, and remembers it for the next launch', () => {
    reported = 54
    stop = startTopInset()
    expect(published()).toBe('54px')
    expect(memory()).toEqual({ 'app:393': 54 })
    expect(readTopInset()).toEqual({ held: 54, reported: 54 })
  })

  it('holds its height when iOS drops the inset for a moment — a keyboard dismiss', () => {
    reported = 54
    stop = startTopInset()
    reported = 0
    resample()
    expect(published()).toBe('54px')
    expect(readTopInset()).toEqual({ held: 54, reported: 0 })
  })

  it('paints the remembered inset before iOS has reported one — the first frame', () => {
    localStorage.setItem(TOP_INSET_MEMORY_KEY, JSON.stringify({ 'app:393': 54 }))
    stop = startTopInset()
    expect(published()).toBe('54px')
  })

  it('rises to a larger reading', () => {
    reported = 47
    stop = startTopInset()
    reported = 54
    resample()
    expect(published()).toBe('54px')
  })

  it('starts a new shape from that shape’s own memory — a tab has no inset of its own', () => {
    reported = 54
    stop = startTopInset()
    installedAt(393, false)
    reported = 0
    resample()
    expect(topInsetShape()).toBe('tab:393')
    expect(published()).toBe('0px')
  })

  it('ignores a memory it cannot read', () => {
    localStorage.setItem(TOP_INSET_MEMORY_KEY, '{not json')
    stop = startTopInset()
    expect(published()).toBe('0px')
  })

  it('leaves nothing behind when stopped', () => {
    reported = 54
    stop = startTopInset()
    stop()
    stop = null
    expect(published()).toBe('')
    expect(readTopInset()).toEqual({ held: 0, reported: 0 })
  })
})
