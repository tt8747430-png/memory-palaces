import { afterEach, describe, expect, it } from 'vitest'
import { STATUS_BAR } from '@/shared/config/status-bar'
import { paintStatusBar, readThemeColors } from './status-bar'

/** The pair the build writes ahead of the boot script, one per OS scheme. */
function writeBuiltMetas() {
  for (const scheme of ['light', 'dark'] as const) {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('media', `(prefers-color-scheme: ${scheme})`)
    meta.setAttribute('content', STATUS_BAR[scheme])
    document.head.append(meta)
  }
}

afterEach(() => {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
})

describe('paintStatusBar', () => {
  it('tells the platform the chosen scheme’s colour through every meta, whatever its media', () => {
    writeBuiltMetas()
    paintStatusBar('dark')
    expect(readThemeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])

    paintStatusBar('light')
    expect(readThemeColors()).toEqual([STATUS_BAR.light, STATUS_BAR.light])
  })

  it('adds no meta of its own where the document carries none', () => {
    paintStatusBar('dark')
    expect(readThemeColors()).toEqual([])
  })
})
