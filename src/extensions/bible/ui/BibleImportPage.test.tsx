import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { i18n } from '@/shared/i18n'
import { bibleMessages } from '../i18n/en'
import { BibleImportPage } from './BibleImportPage'

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

afterEach(cleanup)

describe('BibleImportPage picker', () => {
  it('starts by asking for a book', () => {
    renderWithProviders(<BibleImportPage />)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
  })

  it('walks to the chapter grid, then the verse grids', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    expect(screen.getByText('Pick a chapter')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByText('Pick a starting verse')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByText('Pick an ending verse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Just verse 1' })).toBeInTheDocument()
  })

  it('shows the reference as it is built', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '31' }))
    expect(screen.getByText('Genesis 1:1-31')).toBeInTheDocument()
  })

  it('keeps the text box on screen before anything is picked', () => {
    renderWithProviders(<BibleImportPage />)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
    expect(screen.getByLabelText('Verse text')).toBeInTheDocument()
  })

  it('start over returns to the book list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
  })
})
