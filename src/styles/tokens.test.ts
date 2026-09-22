import { describe, expect, it } from 'vitest'
import { readStylesheet } from '@/shared/test/stylesheet'

const tokens = readStylesheet('tokens.css')
const theme = readStylesheet('theme.css')
const root = tokens.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
const chrome = theme.match(/\.chrome\s*\{([\s\S]*?)\n {2}\}/)?.[1] ?? ''

/**
 * Every colour role `:root` declares, less the ones that are not roles a component names (layers,
 * shadows, sizes, the palette, the chrome's own tokens) — derived, so a role added to the page is a
 * role `.chrome` must answer for, not one a hand-kept list forgets.
 */
const NOT_ROLES = /^(z-|shadow-|glass-|sheet-|p-|chrome-|status-bar$)/

/** Roles that read the same on the chrome block as on the page — each for a reason. */
const SAME_ON_CHROME: Record<string, string> = {
  bg: 'the page canvas; never drawn inside the block',
  'bg-daylight': 'the page canvas; never drawn inside the block',
  'bg-threshold': 'the page canvas; never drawn inside the block',
  scrim: 'an overlay over everything, the block included',
  'nav-surface': 'the dock pill, its own material',
  'nav-pill': 'the dock pill, its own material',
  'nav-ink': 'the dock pill, its own material',
  'nav-ink-active': 'the dock pill, its own material',
  rating: 'gold reads at 4.6:1 on both blocks',
  'rating-edge': 'the edge of a gold fill, read against the fill',
  'warning-on-fill': 'ink on a light warning fill, the same on either',
}

const roles = [...root.matchAll(/^\s+--([\w-]+)\s*:/gm)]
  .map(([, name]) => name!)
  .filter((name) => !NOT_ROLES.test(name) && !name.startsWith('sw-'))

const CHROME_ROLES = roles.filter((name) => !(name in SAME_ON_CHROME))

describe('tinted surfaces', () => {
  it.each(['info', 'success', 'warning', 'danger'])(
    '%s has a border token beside its surface, for the page gradient’s white end',
    (tone) => {
      expect(root).toMatch(new RegExp(`--${tone}-surface\\s*:`))
      expect(root).toMatch(new RegExp(`--${tone}-border\\s*:`))
    },
  )
})

describe('chrome', () => {
  it('takes its surface from the token the platform paints the status bar with', () => {
    expect(root).toContain('--chrome-surface: var(--status-bar)')
  })

  it.each(['ink', 'ink-muted', 'ink-faint', 'fill', 'edge'])(
    'declares --chrome-%s once, beside the surface',
    (role) => {
      expect([...tokens.matchAll(new RegExp(`--chrome-${role}\\s*:`, 'g'))]).toHaveLength(1)
    },
  )

  it.each(CHROME_ROLES)('redeclares --%s, so nothing inside needs a chrome variant', (role) => {
    expect(chrome).toMatch(new RegExp(`--${role}\\s*:`))
  })

  it('keeps its list of roles honest — every exemption names a role the page declares', () => {
    expect(Object.keys(SAME_ON_CHROME).filter((name) => !roles.includes(name))).toEqual([])
  })

  it('names no colour of its own — every value is a token, or a tint mixed from one', () => {
    const values = [...chrome.matchAll(/--[\w-]+:\s*([^;]+);/g)].map(([, value]) => value!.trim())
    const token = /^var\(--[\w-]+\)$/
    const tint = /^color-mix\(in oklch, var\(--[\w-]+\) \d+%, transparent\)$/
    expect(values.filter((value) => !token.test(value) && !tint.test(value))).toEqual([])
  })
})
