import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { THEME_MIRROR_KEY } from './boot-paint'
import { ThemeProvider } from './ThemeProvider'

const STATUS_BAR = { light: '#091a7a', dark: '#0b1533' } as const

/** The two token declarations `tokens.css` carries — `boot-paint.test.ts` pins the real values. */
function declareTokens() {
  const style = document.createElement('style')
  style.id = 'status-bar-tokens'
  style.textContent = `:root { --status-bar: ${STATUS_BAR.light}; } [data-theme='dark'] { --status-bar: ${STATUS_BAR.dark}; }`
  document.head.append(style)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
  localStorage.removeItem(THEME_MIRROR_KEY)
  document.getElementById('status-bar-tokens')?.remove()
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

const themeColor = () =>
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content

describe('ThemeProvider', () => {
  it('paints the status bar in the theme the learner chose, not the one the OS is in', () => {
    mockMatchMedia(false)
    declareTokens()
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#000000" />')
    const { rerender } = render(<ThemeProvider theme="dark">x</ThemeProvider>)
    expect(themeColor()).toBe(STATUS_BAR.dark)

    rerender(<ThemeProvider theme="light">x</ThemeProvider>)
    expect(themeColor()).toBe(STATUS_BAR.light)
  })

  it('tells the platform the colour the stylesheet names, not one of its own', () => {
    mockMatchMedia(false)
    const style = document.createElement('style')
    style.id = 'status-bar-tokens'
    style.textContent = ':root { --status-bar: #123456; }'
    document.head.append(style)
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#000000" />')

    render(<ThemeProvider theme="light">x</ThemeProvider>)

    expect(themeColor()).toBe('#123456')
  })

  it('leaves the bar the boot script painted when the stylesheet has not landed', () => {
    mockMatchMedia(false)
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#091a7a" />')

    render(<ThemeProvider theme="dark">x</ThemeProvider>)

    // No token to read yet: a cleared meta would leave the platform to sample the page.
    expect(themeColor()).toBe('#091a7a')
  })

  it('applies an explicit theme to the document root', () => {
    render(<ThemeProvider theme="dark">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('resolves system to the OS preference', () => {
    mockMatchMedia(true)
    render(<ThemeProvider theme="system">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('dark')
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

  it('follows a live OS change while on system', () => {
    const media = mockMatchMedia(false)
    render(<ThemeProvider theme="system">x</ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe('light')

    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
