import { describe, expect, it } from 'vitest'
import { CARD_STYLE_PRESET_IDS, clampCardTextSize, resolveCardStyle } from './card-style'

const plain = { preset: 'plain', font: 'default', textSize: 30, alignment: 'center' } as const

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

  it('serves each font family', () => {
    expect(resolveCardStyle({ ...plain, font: 'serif' })['--card-style-font']).toContain('serif')
    expect(resolveCardStyle({ ...plain, font: 'mono' })['--card-style-font']).toContain('mono')
  })
})
