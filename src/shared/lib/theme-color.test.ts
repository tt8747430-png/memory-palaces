import { afterEach, describe, expect, it } from 'vitest'
import { STATUS_BAR } from '@/shared/config/status-bar'
import { removeThemeColors, writeBuiltThemeColors } from '@/shared/test/theme-color'
import { paintStatusBar, readThemeColors } from './theme-color'

afterEach(removeThemeColors)

describe('paintStatusBar', () => {
  it('tells the platform the chosen scheme’s colour through every meta, whatever its media', () => {
    writeBuiltThemeColors()
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
