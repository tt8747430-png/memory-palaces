import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readStylesheet } from '@/shared/test/stylesheet'
import { MOTION_MIRROR_KEY, THEME_MIRROR_KEY } from './boot-paint'

/**
 * `index.html` paints before the stylesheet lands, so it carries the status bar's two colours and
 * both mirror keys by hand. Nothing but this test keeps its copies and the app's saying the same
 * thing.
 */
const html = readFileSync(join(import.meta.dirname, '../../../index.html'), 'utf8')

/** The token as `tokens.css` declares it: `:root` first, then the dark theme's override. */
function statusBarTokens(): string[] {
  return [...readStylesheet('tokens.css').matchAll(/--status-bar:\s*([^;]+);/g)].map(
    ([, value]) => value?.trim() ?? '',
  )
}

describe('the status bar before first paint', () => {
  it('declares the token once per scheme, and nowhere else', () => {
    expect(statusBarTokens()).toHaveLength(2)
  })

  it('starts on the light scheme’s token', () => {
    const [light] = statusBarTokens()
    expect(html).toContain(`<meta content="${light}" name="theme-color" />`)
  })

  it('names both of the token’s colours in the script that resolves the theme', () => {
    const [light, dark] = statusBarTokens()
    expect(html).toContain(`'${dark}'`)
    expect(html).toContain(`'${light}'`)
  })

  it('has exactly one status-bar meta, so nothing else can win', () => {
    expect(html.match(/<meta[^>]*name="theme-color"/g)).toHaveLength(1)
  })

  it('paints the canvas from the same token, for a platform that samples instead of reading it', () => {
    expect(readStylesheet('theme.css')).toContain('background: var(--status-bar)')
  })

  it('paints the app’s own chrome from it too, so the bar and the header meet with no seam', () => {
    const theme = readStylesheet('theme.css')
    expect(theme).toContain('background: var(--chrome-surface)')
    expect(readStylesheet('tokens.css')).toContain('--chrome-surface: var(--status-bar)')
  })
})

describe('the mirrors the boot script reads', () => {
  it('reads the theme from the key this module names', () => {
    expect(html).toContain(`localStorage.getItem('${THEME_MIRROR_KEY}')`)
  })

  it('reads the motion switch from the key this module names', () => {
    expect(html).toContain(`localStorage.getItem('${MOTION_MIRROR_KEY}')`)
  })

  it('treats a stored theme other than light or dark as the OS’s to answer', () => {
    expect(html).toContain("stored === 'light' || stored === 'dark'")
    expect(html).toContain("window.matchMedia('(prefers-color-scheme: dark)')")
  })

  it('sets both attributes the stylesheet and shared readers key on', () => {
    expect(html).toContain('document.documentElement.dataset.theme')
    expect(html).toContain('document.documentElement.dataset.reducedMotion')
  })

  it('damps motion when the OS asks, whatever the mirror holds', () => {
    expect(html).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
  })
})
