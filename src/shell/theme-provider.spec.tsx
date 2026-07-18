import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createTestServices } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { ThemeProvider } from './theme-provider'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset['theme']
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((node) => node.remove())
})

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: () => void) => void listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => void listeners.delete(cb),
  }
  vi.stubGlobal('matchMedia', () => mql)
  return { mql, emit: () => listeners.forEach((cb) => cb()) }
}

describe('ThemeProvider', () => {
  it('resolves the default (system) preference to light and syncs all three theme-color metas', () => {
    mockMatchMedia(false)
    const services = createTestServices()

    render(
      <ServicesProvider services={services}>
        <ThemeProvider>x</ThemeProvider>
      </ServicesProvider>,
    )

    expect(document.documentElement.dataset['theme']).toBe('light')

    const metas = document.head.querySelectorAll('meta[name="theme-color"]')
    expect(metas).toHaveLength(3)
    expect(document.head.querySelector('meta[name="theme-color"]:not([media])')).not.toBeNull()
    const contents = new Set(Array.from(metas).map((meta) => meta.getAttribute('content')))
    expect(contents.size).toBe(1)
  })

  it('leaves metas that already carry the right color untouched on re-sync', () => {
    const { emit } = mockMatchMedia(false)
    const services = createTestServices()

    render(
      <ServicesProvider services={services}>
        <ThemeProvider>x</ThemeProvider>
      </ServicesProvider>,
    )

    const before = Array.from(document.head.querySelectorAll('meta[name="theme-color"]'))
    emit()
    const after = Array.from(document.head.querySelectorAll('meta[name="theme-color"]'))

    expect(after).toHaveLength(before.length)
    after.forEach((meta, i) => expect(meta).toBe(before[i]))
  })
})
