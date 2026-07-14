import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeService } from './theme'

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset['theme']
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

describe('ThemeService', () => {
  it('applies an explicit theme to the document root', () => {
    new ThemeService().set('dark')
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })

  it('resolves system to the OS preference', () => {
    mockMatchMedia(true)
    new ThemeService().set('system')
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })

  it('follows a live OS change while on system', () => {
    const media = mockMatchMedia(false)
    new ThemeService().set('system')
    expect(document.documentElement.dataset['theme']).toBe('light')

    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })

  it('stops following the OS after switching to an explicit theme', () => {
    const media = mockMatchMedia(false)
    const theme = new ThemeService()
    theme.set('system')
    theme.set('light')

    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset['theme']).toBe('light')
  })
})
