import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { STATUS_BAR } from '@/shared/config/status-bar'
import { THEME_MIRROR_KEY } from './boot-paint'
import { ThemeProvider } from './ThemeProvider'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
  localStorage.removeItem(THEME_MIRROR_KEY)
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
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

/** The pair the build writes, as the boot script left it for a light first frame. */
function writeBuiltMetas() {
  for (const scheme of ['light', 'dark'] as const) {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('media', `(prefers-color-scheme: ${scheme})`)
    meta.setAttribute('content', STATUS_BAR.light)
    document.head.append(meta)
  }
}

const themeColors = () =>
  [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map(
    (meta) => meta.content,
  )

describe('ThemeProvider', () => {
  it('paints the status bar in the theme the learner chose, not the one the OS is in', () => {
    mockMatchMedia(false)
    writeBuiltMetas()
    const { rerender } = render(<ThemeProvider theme="dark">x</ThemeProvider>)
    expect(themeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])

    rerender(<ThemeProvider theme="light">x</ThemeProvider>)
    expect(themeColors()).toEqual([STATUS_BAR.light, STATUS_BAR.light])
  })

  it('leaves the boot script’s paint alone until the stored choice is known', () => {
    // The store's default is not the learner's choice: painting it handed iOS the OS's colour on
    // every launch whose theme differed from the OS's, and mirrored `system` over the real choice.
    mockMatchMedia(false)
    writeBuiltMetas()
    document.documentElement.dataset.theme = 'dark'
    localStorage.setItem(THEME_MIRROR_KEY, 'dark')
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = STATUS_BAR.dark
    }

    const { rerender } = render(<ThemeProvider theme={undefined}>x</ThemeProvider>)

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(themeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('dark')

    rerender(<ThemeProvider theme="dark">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(themeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('applies an explicit theme to the document root', () => {
    render(<ThemeProvider theme="dark">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('resolves system to the OS preference', () => {
    mockMatchMedia(true)
    writeBuiltMetas()
    render(<ThemeProvider theme="system">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(themeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('mirrors the choice, not the scheme it resolved to', () => {
    mockMatchMedia(true)
    render(<ThemeProvider theme="system">x</ThemeProvider>)

    expect(document.documentElement.dataset.theme).toBe('dark')
    // 'dark' here would make the next launch paint from an OS setting that may have changed.
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('system')
  })

  it('mirrors an explicit choice as itself', () => {
    mockMatchMedia(true)
    render(<ThemeProvider theme="light">x</ThemeProvider>)

    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('light')
  })

  it('follows a live OS change while on system, status bar and all', () => {
    const media = mockMatchMedia(false)
    writeBuiltMetas()
    render(<ThemeProvider theme="system">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('light')

    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(themeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })
})
