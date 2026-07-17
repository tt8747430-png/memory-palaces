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
  it('resolves the default (system) preference to light and syncs both theme-color metas', () => {
    mockMatchMedia(false)
    const services = createTestServices()

    render(
      <ServicesProvider services={services}>
        <ThemeProvider>x</ThemeProvider>
      </ServicesProvider>,
    )

    expect(document.documentElement.dataset['theme']).toBe('light')

    const metas = document.head.querySelectorAll('meta[name="theme-color"]')
    expect(metas).toHaveLength(2)
    const contents = new Set(Array.from(metas).map((meta) => meta.getAttribute('content')))
    expect(contents.size).toBe(1)
  })
})
