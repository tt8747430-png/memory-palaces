import { describe, expect, it } from 'vitest'
import { readStylesheet } from '@/shared/test/stylesheet'
import {
  CARD_STYLE_PRESET_IDS,
  cardSceneChrome,
  CHROME_TOKENS,
  clampCardTextSize,
  coerceCardStyle,
  resolveCardScene,
  resolveCardStyle,
  sameCardStyle,
} from './index'

const plain = { preset: 'plain', font: 'default', textSize: 30, alignment: 'center' } as const

const TOKEN_PRESETS = ['plain'] as const

const PRINTED_PRESETS = CARD_STYLE_PRESET_IDS.filter(
  (id) => !TOKEN_PRESETS.includes(id as (typeof TOKEN_PRESETS)[number]),
)

const tokens = readStylesheet('tokens.css')

const DECLARED = new Set([...tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map(([, name]) => name))

function sceneBlock(chrome: 'dark' | 'light'): Map<string, string> {
  const body = new RegExp(`\\[data-scene='${chrome}'\\]\\s*\\{([^}]*)\\}`).exec(tokens)?.[1]
  expect(body, `tokens.css has no [data-scene='${chrome}'] block`).toBeTruthy()
  return new Map(
    [...(body ?? '').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name ?? '', (value ?? '').trim()] as const,
    ),
  )
}

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

  it('names only custom properties the app defines', () => {
    expect(DECLARED.size).toBeGreaterThan(20)
    for (const preset of CARD_STYLE_PRESET_IDS) {
      const style = resolveCardStyle({ ...plain, preset })
      const scene = resolveCardScene({ ...plain, preset })
      const painted = [...Object.values(style), ...Object.values(scene)].join(' ')
      for (const [, name] of painted.matchAll(/var\((--[a-z0-9-]+)/g)) {
        expect(DECLARED, `${preset} paints from ${name}`).toContain(name)
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

  it('carries nothing but the backdrop — the chrome is an attribute', () => {
    for (const preset of CARD_STYLE_PRESET_IDS) {
      expect(Object.keys(resolveCardScene({ ...plain, preset }))).toEqual(['--scene-bg'])
    }
  })
})

describe('cardSceneChrome', () => {
  it('leaves the app chrome alone for the presets that follow the theme', () => {
    for (const preset of TOKEN_PRESETS) {
      expect(cardSceneChrome({ ...plain, preset })).toBeUndefined()
    }
  })

  it('lights every printed preset from one of the two blocks', () => {
    for (const preset of PRINTED_PRESETS) {
      expect(['dark', 'light'], `${preset} has no printed chrome`).toContain(
        cardSceneChrome({ ...plain, preset }),
      )
    }
  })

  it('repaints every chrome token a printed scene would otherwise swallow', () => {
    for (const chrome of ['dark', 'light'] as const) {
      const block = sceneBlock(chrome)
      for (const token of CHROME_TOKENS) {
        expect([...block.keys()], `the ${chrome} scene leaves ${token} to the app`).toContain(token)
      }
    }
  })

  it('declares nothing in a scene block beyond that set', () => {
    const allowed = new Set<string>(CHROME_TOKENS)
    for (const chrome of ['dark', 'light'] as const) {
      for (const token of sceneBlock(chrome).keys()) {
        expect(allowed, `the ${chrome} scene sets ${token}`).toContain(token)
      }
    }
  })

  it('paints a scene block only from primitives the app declares', () => {
    for (const chrome of ['dark', 'light'] as const) {
      for (const [token, value] of sceneBlock(chrome)) {
        for (const [, name] of value.matchAll(/var\((--[a-z0-9-]+)/g)) {
          expect(DECLARED, `the ${chrome} scene's ${token} paints from ${name}`).toContain(name)
        }
      }
    }
  })
})

describe('coerceCardStyle', () => {
  const retired = { ...plain, preset: 'outlined', font: 'comic' } as never

  it('leaves a style the app still has exactly as it found it', () => {
    const live = { preset: 'meadow', font: 'hand', textSize: 22, alignment: 'left' } as const
    expect(coerceCardStyle(live)).toEqual(live)
  })

  it('snaps a field naming something the app no longer has back to the default', () => {
    expect(coerceCardStyle(retired)).toEqual({
      preset: 'plain',
      font: 'default',
      textSize: 30,
      alignment: 'center',
    })
  })

  it('keeps the fields that are still good when another is not', () => {
    const half = { ...plain, preset: 'outlined', textSize: 18, alignment: 'right' } as never
    expect(coerceCardStyle(half)).toMatchObject({
      preset: 'plain',
      textSize: 18,
      alignment: 'right',
    })
  })

  it('paints a retired preset instead of throwing — the study screen must not crash', () => {
    expect(() => resolveCardStyle(retired)).not.toThrow()
    expect(resolveCardStyle(retired)['--card-style-bg']).toBe(
      resolveCardStyle(plain)['--card-style-bg'],
    )
    expect(resolveCardScene(retired)['--scene-bg']).toBe(resolveCardScene(plain)['--scene-bg'])
    expect(cardSceneChrome(retired)).toBeUndefined()
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

  it('compares the size the card would actually be drawn at', () => {
    expect(sameCardStyle({ ...plain, textSize: 40 }, { ...plain, textSize: 99 })).toBe(true)
    expect(sameCardStyle({ ...plain, textSize: 14 }, { ...plain, textSize: 2 })).toBe(true)
  })
})
