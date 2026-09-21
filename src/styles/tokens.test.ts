import { describe, expect, it } from 'vitest'
import { readStylesheet } from '@/shared/test/stylesheet'

const tokens = readStylesheet('tokens.css')
const root = tokens.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

describe('tinted surfaces', () => {
  it.each(['info', 'success', 'warning', 'danger'])(
    '%s has a border token beside its surface, for the page gradient’s white end',
    (tone) => {
      expect(root).toMatch(new RegExp(`--${tone}-surface\\s*:`))
      expect(root).toMatch(new RegExp(`--${tone}-border\\s*:`))
    },
  )
})
