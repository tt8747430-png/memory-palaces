import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STATUS_BAR } from '@/shared/config/status-bar'
import { writeBuiltThemeColors } from '@/shared/test/theme-color'
import { MOTION_MIRROR_KEY, THEME_MIRROR_KEY } from './boot-paint'

const html = readFileSync(join(import.meta.dirname, '../../../index.html'), 'utf8')
const boot = html.match(/<script id="boot-paint">([\s\S]*?)<\/script>/)?.[1]

/** Answers each media query from the given set — the OS the boot script asks. */
function stubOs(matching: string[] = []) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: matching.includes(query) }))
}

const OS_DARK = '(prefers-color-scheme: dark)'

/** Runs the boot script as the browser does: before the stylesheet and before any module. */
function runBoot() {
  if (!boot) throw new Error('index.html has no <script id="boot-paint">')
  new Function(boot)()
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.reducedMotion
  document.head.querySelectorAll('meta').forEach((meta) => meta.remove())
})

describe('the status bar in index.html', () => {
  it('is painted by iOS, below which the web view reaches the bottom of the screen', () => {
    expect(html.match(/name="apple-mobile-web-app-status-bar-style"/g)).toHaveLength(1)
    expect(html).toContain('<meta content="black" name="apple-mobile-web-app-status-bar-style" />')
  })

  it('carries no theme-color of its own — the build writes one per scheme from STATUS_BAR', () => {
    expect(html).not.toMatch(/<meta[^>]*name="theme-color"/)
  })
})

describe('the boot script', () => {
  it('paints the theme the learner chose, not the one the OS is in', () => {
    stubOs([OS_DARK])
    localStorage.setItem(THEME_MIRROR_KEY, 'light')
    const metas = writeBuiltThemeColors()

    runBoot()

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(metas.map((meta) => meta.content)).toEqual([STATUS_BAR.light, STATUS_BAR.light])
  })

  it('hands every theme-color the chosen theme’s colour, whatever its media says', () => {
    stubOs()
    localStorage.setItem(THEME_MIRROR_KEY, 'dark')
    const metas = writeBuiltThemeColors()

    runBoot()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(metas.map((meta) => meta.content)).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('asks the OS when the choice is system', () => {
    stubOs([OS_DARK])
    localStorage.setItem(THEME_MIRROR_KEY, 'system')
    const metas = writeBuiltThemeColors()

    runBoot()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(metas.map((meta) => meta.content)).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('asks the OS on a device that has never stored a choice', () => {
    stubOs([OS_DARK])
    runBoot()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('asks the OS when the stored choice is not one it knows', () => {
    stubOs([OS_DARK])
    localStorage.setItem(THEME_MIRROR_KEY, 'banana')
    const metas = writeBuiltThemeColors()

    runBoot()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(metas.map((meta) => meta.content)).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('asks the OS when storage cannot be read at all', () => {
    stubOs([OS_DARK])
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    })

    runBoot()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('paints light when the OS cannot be asked', () => {
    // jsdom has no matchMedia: the script's own guard is all that answers.
    runBoot()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('damps motion when the OS asks, or when the learner’s mirrored switch does', () => {
    stubOs(['(prefers-reduced-motion: reduce)'])
    runBoot()
    expect(document.documentElement.dataset.reducedMotion).toBe('reduce')

    stubOs()
    localStorage.setItem(MOTION_MIRROR_KEY, 'on')
    runBoot()
    expect(document.documentElement.dataset.reducedMotion).toBe('reduce')

    localStorage.setItem(MOTION_MIRROR_KEY, 'off')
    runBoot()
    expect(document.documentElement.dataset.reducedMotion).toBe('system')
  })

  it('locks zoom in an installed app, and leaves a tab zoomable', () => {
    const viewport = document.createElement('meta')
    viewport.name = 'viewport'
    viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover'
    document.head.append(viewport)

    stubOs()
    runBoot()
    expect(viewport.content).not.toContain('user-scalable=no')

    stubOs(['(display-mode: standalone)'])
    runBoot()
    expect(viewport.content).toContain('user-scalable=no')
  })
})
