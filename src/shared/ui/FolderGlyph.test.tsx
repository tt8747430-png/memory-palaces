import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { FolderGlyph } from './FolderGlyph'

afterEach(cleanup)

describe('FolderGlyph', () => {
  it('renders the provided icon', () => {
    renderWithProviders(<FolderGlyph icon="📁" color="from-rose-500 to-pink-600" />)
    expect(screen.getByText('📁')).toBeInTheDocument()
  })

  it('falls back to a default color gradient when none is given', () => {
    const { container } = renderWithProviders(<FolderGlyph icon="📁" color="" />)
    const cover = container.querySelector('.rounded-card')
    expect(cover?.className).toContain('from-sky-500')
  })
})
