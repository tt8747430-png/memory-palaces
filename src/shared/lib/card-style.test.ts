import { describe, expect, it } from 'vitest'
import { readStylesheet } from '@/shared/test/stylesheet'
import {
  CARD_STYLE_PRESET_IDS,
  CHROME_TOKENS,
  clampCardTextSize,
  resolveCardScene,
  resolveCardStyle,
  sameCardStyle,
} from './card-style'

const plain = { preset: 'plain', font: 'default', textSize: 30, alignment: 'center' } as const

/** Only these two follow the theme; every other preset is a printed material with fixed colours. */
const TOKEN_PRESETS = ['plain', 'outlined'] as const

const PRINTED_PRESETS = CARD_STYLE_PRESET_IDS.filter(
  (id) => !TOKEN_PRESETS.includes(id as (typeof TOKEN_PRESETS)[number]),
)

describe('resolveCardStyle', () => {
  it('turns a style into custom properties', () => {
    const vars = resolveCardStyle(plain)
    expect(vars['--card-style-size']).toBe('30px')
    expect(vars['--card-style-align']).toBe('center')
    expect(vars['--card-style-font']).toContain('system-ui')
  })

  it('clamps a text size into 14–40', () => {
    expect(clampCardTextSize(4)).toBe(14)
    expect(clampCardTextSize(400)).toBe(40)
    expect(clampCardTextSize(22)).toBe(22)
    expect(resolveCardStyle({ ...plain, textSize: 400 })['--card-style-size']).toBe('40px')
  })

  it('gives every preset a background and an ink colour', () => {
    for (const preset of CARD_STYLE_PRESET_IDS) {
      const vars = resolveCardStyle({ ...plain, preset })
      expect(vars['--card-style-bg']).toBeTruthy()
      expect(vars['--card-style-ink']).toBeTruthy()
    }
  })

  /**
   * A card painted from a custom property nothing defines is a transparent card with no border —
   * which is exactly how `plain` and `outlined` shipped once. Every `var()` a preset names has to
   * be one the app actually declares, so the list of those is read from the stylesheet rather than
   * kept by hand beside it.
   */
  it('names only custom properties the app defines', () => {
    const tokens = readStylesheet('tokens.css')
    const declared = new Set(
      [...tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map(([, name]) => name),
    )
    expect(declared.size).toBeGreaterThan(20)
    for (const preset of CARD_STYLE_PRESET_IDS) {
      const style = resolveCardStyle({ ...plain, preset })
      const scene = resolveCardScene({ ...plain, preset })
      const painted = [...Object.values(style), ...Object.values(scene)].join(' ')
      for (const [, name] of painted.matchAll(/var\((--[a-z0-9-]+)/g)) {
        expect(declared, `${preset} paints from ${name}`).toContain(name)
      }
    }
  })

  it('serves each font family', () => {
    expect(resolveCardStyle({ ...plain, font: 'serif' })['--card-style-font']).toContain('serif')
    expect(resolveCardStyle({ ...plain, font: 'mono' })['--card-style-font']).toContain('mono')
  })
})

describe('resolveCardScene', () => {
  it('gives every preset a backdrop', () => {
    for (const preset of CARD_STYLE_PRESET_IDS) {
      expect(resolveCardScene({ ...plain, preset })['--scene-bg']).toBeTruthy()
    }
  })

  it('leaves the app chrome alone for the presets that follow the theme', () => {
    for (const preset of TOKEN_PRESETS) {
      expect(Object.keys(resolveCardScene({ ...plain, preset }))).toEqual(['--scene-bg'])
    }
  })

  /**
   * All of them, not a sample: a token left out keeps the app's own value inside a printed scene,
   * which is how `bg-card` stayed white under `night` and the answer field became white-on-white.
   */
  it('repaints every chrome token a printed scene would otherwise swallow', () => {
    for (const preset of PRINTED_PRESETS) {
      const scene = resolveCardScene({ ...plain, preset })
      for (const token of CHROME_TOKENS) {
        expect(scene[token], `${preset} leaves ${token} to the app`).toBeTruthy()
      }
    }
  })

  it('adds nothing to a scene beyond the backdrop and that set', () => {
    const allowed = new Set<string>(['--scene-bg', ...CHROME_TOKENS])
    for (const preset of CARD_STYLE_PRESET_IDS) {
      for (const key of Object.keys(resolveCardScene({ ...plain, preset }))) {
        expect(allowed, `${preset} sets ${key}`).toContain(key)
      }
    }
  })
})

describe('sameCardStyle', () => {
  it('is true for a style that would paint the same card', () => {
    expect(sameCardStyle(plain, { ...plain })).toBe(true)
  })

  it('sees a change in any one of the four', () => {
    expect(sameCardStyle(plain, { ...plain, preset: 'chalk' })).toBe(false)
    expect(sameCardStyle(plain, { ...plain, font: 'mono' })).toBe(false)
    expect(sameCardStyle(plain, { ...plain, alignment: 'left' })).toBe(false)
    expect(sameCardStyle(plain, { ...plain, textSize: 22 })).toBe(false)
  })

  /** The stored size is clamped, so a draft the clamp would flatten is not a change. */
  it('compares the size the card would actually be drawn at', () => {
    expect(sameCardStyle({ ...plain, textSize: 40 }, { ...plain, textSize: 99 })).toBe(true)
    expect(sameCardStyle({ ...plain, textSize: 14 }, { ...plain, textSize: 2 })).toBe(true)
  })
})
