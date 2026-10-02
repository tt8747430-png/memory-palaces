import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { STATUS_BAR } from '@/shared/config/status-bar'
import { readThemeColors } from '@/shared/lib'
import { removeThemeColors, writeBuiltThemeColors } from '@/shared/test/theme-color'
import type { Theme } from '@/entities/preferences'
import { THEME_MIRROR_KEY } from './boot-paint'
import { useDeviceTheme } from './use-device-theme'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
  localStorage.removeItem(THEME_MIRROR_KEY)
  removeThemeColors()
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

const renderTheme = (theme: Theme) =>
  renderHook(({ theme }) => useDeviceTheme(theme), { initialProps: { theme } })

describe('useDeviceTheme', () => {
  it('paints the status bar in the theme the learner chose, not the one the OS is in', () => {
    mockMatchMedia(false)
    writeBuiltThemeColors()
    const { rerender } = renderTheme('dark')
    expect(readThemeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])

    rerender({ theme: 'light' })
    expect(readThemeColors()).toEqual([STATUS_BAR.light, STATUS_BAR.light])
  })

  it('applies an explicit theme to the document root', () => {
    renderTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('resolves system to the OS preference', () => {
    mockMatchMedia(true)
    writeBuiltThemeColors()
    renderTheme('system')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(readThemeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('mirrors the choice, not the scheme it resolved to', () => {
    mockMatchMedia(true)
    renderTheme('system')

    expect(document.documentElement.dataset.theme).toBe('dark')
    // 'dark' here would make the next launch paint from an OS setting that may have changed.
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('system')
  })

  it('mirrors an explicit choice as itself', () => {
    mockMatchMedia(true)
    renderTheme('light')

    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('light')
  })

  it('follows a live OS change while on system, status bar and all', () => {
    const media = mockMatchMedia(false)
    writeBuiltThemeColors()
    renderTheme('system')
    expect(document.documentElement.dataset.theme).toBe('light')

    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(readThemeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('stops following the OS once the learner picks a theme of their own', () => {
    const media = mockMatchMedia(false)
    const { rerender } = renderTheme('system')

    rerender({ theme: 'light' })
    media.mql.matches = true
    media.emit()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
