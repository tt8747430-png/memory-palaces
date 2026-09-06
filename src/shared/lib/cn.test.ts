import { describe, expect, it } from 'vitest'

import { cn } from './cn'

/**
 * `tailwind-merge` only knows Tailwind's own scales. Every size, radius and elevation in this app
 * is a custom name, so without being told the theme it filed all of them under whichever group its
 * fallback matched first — `text-label` as a *colour*, `rounded-card` as nothing at all. The result
 * was a merge that dropped a font size whenever a colour followed it and kept two radii that
 * cannot both apply. These tests are the theme, restated as behaviour.
 */
describe('cn', () => {
  it('keeps a type size and a text colour side by side', () => {
    expect(cn('text-label', 'font-medium', 'text-heading')).toBe(
      'text-label font-medium text-heading',
    )
    expect(cn('truncate text-label', 'text-muted-foreground')).toBe(
      'truncate text-label text-muted-foreground',
    )
    expect(cn('h-11 px-3.5 text-entry text-foreground')).toBe(
      'h-11 px-3.5 text-entry text-foreground',
    )
  })

  it('still resolves two sizes, or two colours, to the last one', () => {
    expect(cn('text-body', 'text-title')).toBe('text-title')
    expect(cn('text-heading', 'text-primary')).toBe('text-primary')
  })

  it('resolves a themed radius against a Tailwind one', () => {
    expect(cn('rounded-card', 'rounded-full')).toBe('rounded-full')
    expect(cn('rounded-tile-slot', 'rounded-card')).toBe('rounded-card')
  })

  it('resolves a themed elevation against `shadow-none`', () => {
    expect(cn('shadow-rest', 'shadow-none')).toBe('shadow-none')
    expect(cn('shadow-rest', 'shadow-elevated')).toBe('shadow-elevated')
  })

  it('treats the hand-written inset paddings as padding, not as unknown classes', () => {
    expect(cn('pb-safe', 'pb-28')).toBe('pb-28')
    expect(cn('pb-28', 'pb-safe')).toBe('pb-safe')
    expect(cn('pb-keyboard', 'pb-4')).toBe('pb-4')
    expect(cn('p-6', 'pb-safe-keyboard')).toBe('p-6 pb-safe-keyboard')
    expect(cn('pt-safe', 'pt-4')).toBe('pt-4')
  })
})
