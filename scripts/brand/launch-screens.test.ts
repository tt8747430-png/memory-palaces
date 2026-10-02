import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LAUNCH_SCREENS } from './launch-screens.ts'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '../../public')

/** A PNG's width and height, from its IHDR chunk. */
function pngSize(file: string): [number, number] {
  const bytes = readFileSync(join(PUBLIC, file))
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

describe('LAUNCH_SCREENS', () => {
  it('names each image once', () => {
    const files = LAUNCH_SCREENS.map(({ file }) => file)
    expect(new Set(files).size).toBe(files.length)
  })

  it('has a light and a dark image for every screen it matches', () => {
    const light = LAUNCH_SCREENS.filter(({ theme }) => theme === 'light')
    expect(light.length * 2).toBe(LAUNCH_SCREENS.length)
  })

  it.each(LAUNCH_SCREENS.map((screen) => [screen.file, screen] as const))(
    '%s is drawn, at the device’s pixels',
    (file, { width, height, ratio }) => {
      expect(existsSync(join(PUBLIC, file)), 'run `npm run brand:assets`').toBe(true)
      expect(pngSize(file)).toEqual([width * ratio, height * ratio])
    },
  )

  it('leaves no image behind that no screen names', () => {
    const named = new Set(LAUNCH_SCREENS.map(({ file }) => file))
    const stray = readdirSync(join(PUBLIC, 'splash')).filter((name) => !named.has(`splash/${name}`))
    expect(stray).toEqual([])
  })
})
