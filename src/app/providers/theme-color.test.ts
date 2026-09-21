import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { THEME_COLOR } from './theme-color'

/**
 * `index.html` paints the status bar before any of this code runs, so it carries the same two
 * values by hand. Nothing but this test keeps the two copies saying the same thing.
 */
const html = readFileSync(join(import.meta.dirname, '../../../index.html'), 'utf8')

describe('the status bar before first paint', () => {
  it('starts on the light colour this module names', () => {
    expect(html).toContain(`<meta content="${THEME_COLOR.light}" name="theme-color" />`)
  })

  it('names both of this module’s colours in the script that resolves the theme', () => {
    expect(html).toContain(`'${THEME_COLOR.dark}'`)
    expect(html).toContain(`'${THEME_COLOR.light}'`)
  })

  it('has exactly one status-bar meta, so nothing else can win', () => {
    expect(html.match(/<meta[^>]*name="theme-color"/g)).toHaveLength(1)
  })
})
