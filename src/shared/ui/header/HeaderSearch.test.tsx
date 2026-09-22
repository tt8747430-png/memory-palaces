import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SearchField } from '../SearchField'
import { ScreenHeader } from './ScreenHeader'

afterEach(cleanup)

const field = (
  <SearchField
    value=""
    onValueChange={() => {}}
    placeholder="Search cards"
    onClose={() => {}}
    closeLabel="Close search"
  />
)

describe('HeaderSearch', () => {
  it('slides in whole — nothing clips the field or its focus ring on the way', async () => {
    renderWithProviders(<ScreenHeader title="Deck" search={field} />, { reducedMotion: 'never' })
    const overlay = screen.getByRole('searchbox').closest('[data-slot="header-search"]')
    expect(overlay).not.toBeNull()
    const style = (overlay as HTMLElement).style
    expect(style.clipPath).toBe('')
    await waitFor(() => expect(style.opacity).toBe('1'))
    expect(style.clipPath).toBe('')
  })
})

describe('HeaderSearch gutter', () => {
  it('keeps the bar’s gutter and the ring, so the ring never reaches the screen edge', () => {
    renderWithProviders(<ScreenHeader title="Deck" search={field} />)
    const overlay = screen.getByRole('searchbox').closest('[data-slot="header-search"]')
    expect(overlay).toHaveClass('left-3')
    expect(overlay).toHaveClass('right-3')
  })
})

describe('SearchField', () => {
  it('keeps the close control clear of the field’s focus ring', () => {
    renderWithProviders(field)
    const row = screen.getByRole('searchbox').parentElement?.parentElement
    // gap-2 = 8px ≥ the 5px the ring draws outside the field; gap-1 (4px) let the two collide.
    expect(row).toHaveClass('gap-2')
    expect(row).not.toHaveClass('gap-1')
  })
})
