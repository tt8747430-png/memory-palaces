import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
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
  it('applies an explicit theme to the document root', () => {
    render(<ThemeProvider theme="dark">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('resolves system to the OS preference', () => {
    mockMatchMedia(true)
    render(<ThemeProvider theme="system">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('follows a live OS change while on system', () => {
    const media = mockMatchMedia(false)
    render(<ThemeProvider theme="system">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('light')

    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
