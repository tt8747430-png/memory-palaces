import { describe, expect, it } from 'vitest'
import { readStylesheet } from '@/shared/test/stylesheet'
import { STATUS_BAR } from './status-bar'

/** `--status-bar` as `tokens.css` declares it: `:root` first, then the dark theme's override. */
const declared = [...readStylesheet('tokens.css').matchAll(/--status-bar:\s*([^;]+);/g)].map(
  ([, value]) => value?.trim().toLowerCase(),
)

describe('STATUS_BAR', () => {
  it('is declared once per scheme in tokens.css, and nowhere else', () => {
    expect(declared).toHaveLength(2)
  })

  it('is the colour the light chrome is painted with', () => {
    expect(STATUS_BAR.light).toBe(declared[0])
  })

  it('is the colour the dark chrome is painted with', () => {
    expect(STATUS_BAR.dark).toBe(declared[1])
  })

  it('paints the header’s chrome and the canvas behind the app, so the bar meets both', () => {
    expect(readStylesheet('tokens.css')).toContain('--chrome-surface: var(--status-bar)')
    expect(readStylesheet('theme.css')).toContain('background: var(--status-bar)')
  })
})
