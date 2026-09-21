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

const SCHEMES = ['light', 'dark'] as const

const TOKEN_PRESETS = ['plain'] as const

const PRINTED_PRESETS = CARD_STYLE_PRESET_IDS.filter(
  (id) => !TOKEN_PRESETS.includes(id as (typeof TOKEN_PRESETS)[number]),
)

const tokens = readStylesheet('tokens.css')

const DECLARED = new Set([...tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map(([, name]) => name))

/** The bottom paint of a layered `background`: the last top-level comma-separated layer. */
function lastLayer(value: string): string {
  const layers: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    else if (ch === ',' && depth === 0) {
      layers.push(value.slice(start, i).trim())
      start = i + 1
    }
  }
  layers.push(value.slice(start).trim())
  return layers[layers.length - 1] ?? ''
}

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
    const vars = resolveCardStyle(plain, 'light')
    expect(vars['--card-style-size']).toBe('30px')
    expect(vars['--card-style-align']).toBe('center')
    expect(vars['--card-style-font']).toContain('system-ui')
  })

  it('clamps a text size into 14–40', () => {
    expect(clampCardTextSize(4)).toBe(14)
    expect(clampCardTextSize(400)).toBe(40)
    expect(clampCardTextSize(22)).toBe(22)
    expect(resolveCardStyle({ ...plain, textSize: 400 }, 'light')['--card-style-size']).toBe('40px')
  })

  it('gives every preset a background and an ink colour, in either scheme', () => {
    for (const scheme of SCHEMES) {
      for (const preset of CARD_STYLE_PRESET_IDS) {
        const vars = resolveCardStyle({ ...plain, preset }, scheme)
        expect(vars['--card-style-bg'], `${preset}/${scheme}`).toBeTruthy()
        expect(vars['--card-style-ink'], `${preset}/${scheme}`).toBeTruthy()
      }
    }
  })

  it('paints every face on an opaque base — the stack behind must not show through', () => {
    for (const scheme of SCHEMES) {
      for (const preset of CARD_STYLE_PRESET_IDS) {
        const base = lastLayer(
          resolveCardStyle({ ...plain, preset }, scheme)['--card-style-bg'] ?? '',
        )
        expect(base, `${preset}/${scheme} has no base paint`).toBeTruthy()
        expect(base, `${preset}/${scheme} base is translucent: ${base}`).not.toMatch(
          /rgba\(|hsla\(|\/\s*0?\.\d|transparent/,
        )
      }
    }
  })

  it('has a night rendition of every printed preset, and keeps them apart', () => {
    for (const preset of PRINTED_PRESETS) {
      const day = resolveCardStyle({ ...plain, preset }, 'light')
      const night = resolveCardStyle({ ...plain, preset }, 'dark')
      expect(
        night['--card-style-bg'],
        `${preset} paints the same face at night as by day`,
      ).not.toBe(day['--card-style-bg'])
      expect(resolveCardScene({ ...plain, preset }, 'dark')['--scene-bg']).not.toBe(
        resolveCardScene({ ...plain, preset }, 'light')['--scene-bg'],
      )
    }
  })

  it('follows the theme for the presets that are made of tokens', () => {
    for (const preset of TOKEN_PRESETS) {
      expect(resolveCardStyle({ ...plain, preset }, 'dark')).toEqual(
        resolveCardStyle({ ...plain, preset }, 'light'),
      )
    }
  })

  it('names only custom properties the app defines', () => {
    expect(DECLARED.size).toBeGreaterThan(20)
    for (const scheme of SCHEMES) {
      for (const preset of CARD_STYLE_PRESET_IDS) {
        const style = resolveCardStyle({ ...plain, preset }, scheme)
        const scene = resolveCardScene({ ...plain, preset }, scheme)
        const painted = [...Object.values(style), ...Object.values(scene)].join(' ')
        for (const [, name] of painted.matchAll(/var\((--[a-z0-9-]+)/g)) {
          expect(DECLARED, `${preset} paints from ${name}`).toContain(name)
        }
      }
    }
  })

  it('serves each font family', () => {
    expect(resolveCardStyle({ ...plain, font: 'serif' }, 'light')['--card-style-font']).toContain(
      'serif',
    )
    expect(resolveCardStyle({ ...plain, font: 'mono' }, 'light')['--card-style-font']).toContain(
      'mono',
    )
  })
})

describe('resolveCardScene', () => {
  it('gives every preset a backdrop, in either scheme', () => {
    for (const scheme of SCHEMES) {
      for (const preset of CARD_STYLE_PRESET_IDS) {
        expect(resolveCardScene({ ...plain, preset }, scheme)['--scene-bg']).toBeTruthy()
      }
    }
  })

  it('carries nothing but the backdrop — the chrome is an attribute', () => {
    for (const preset of CARD_STYLE_PRESET_IDS) {
      expect(Object.keys(resolveCardScene({ ...plain, preset }, 'light'))).toEqual(['--scene-bg'])
    }
  })
})

describe('cardSceneChrome', () => {
  it('leaves the app chrome alone for the presets that follow the theme', () => {
    for (const preset of TOKEN_PRESETS) {
      expect(cardSceneChrome({ ...plain, preset }, 'light')).toBeUndefined()
    }
  })

  it('lights every printed preset from one of the two blocks, in either scheme', () => {
    for (const scheme of SCHEMES) {
      for (const preset of PRINTED_PRESETS) {
        expect(['dark', 'light'], `${preset}/${scheme} has no printed chrome`).toContain(
          cardSceneChrome({ ...plain, preset }, scheme),
        )
      }
    }
  })

  it('lights a night rendition from the dark block — its paper is dark', () => {
    for (const preset of PRINTED_PRESETS) {
      expect(cardSceneChrome({ ...plain, preset }, 'dark'), `${preset} at night`).toBe('dark')
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
    expect(() => resolveCardStyle(retired, 'light')).not.toThrow()
    expect(resolveCardStyle(retired, 'light')['--card-style-bg']).toBe(
      resolveCardStyle(plain, 'light')['--card-style-bg'],
    )
    expect(resolveCardScene(retired, 'light')['--scene-bg']).toBe(
      resolveCardScene(plain, 'light')['--scene-bg'],
    )
    expect(cardSceneChrome(retired, 'light')).toBeUndefined()
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
