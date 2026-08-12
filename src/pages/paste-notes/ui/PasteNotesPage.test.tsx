import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { PasteNotesPage } from './PasteNotesPage'

afterEach(cleanup)

const CHAPTER = '3 John 1\n(1:1) The elder, to Gaius\n(1:2) Beloved, I pray'

function renderNewDeckPage() {
  renderWithProviders(
    <PasteNotesPage newDeck defaultDeckName="New Deck" onBack={vi.fn()} onReview={vi.fn()} />,
  )
  return {
    name: () => screen.getByLabelText('Deck name') as HTMLInputElement,
    box: () => screen.getByPlaceholderText(/Front side 1/),
  }
}

describe('PasteNotesPage deck name', () => {
  it('starts on the generated default', () => {
    const page = renderNewDeckPage()
    expect(page.name().value).toBe('New Deck')
  })

  it('names the deck after a pasted Bible chapter', async () => {
    const user = userEvent.setup()
    const page = renderNewDeckPage()

    await user.click(page.box())
    await user.paste(CHAPTER)

    expect(page.name().value).toBe('3 John 1')
  })

  it('keeps a name the reader typed, whatever is pasted afterwards', async () => {
    const user = userEvent.setup()
    const page = renderNewDeckPage()

    await user.clear(page.name())
    await user.type(page.name(), 'Memory verses')
    await user.click(page.box())
    await user.paste(CHAPTER)

    expect(page.name().value).toBe('Memory verses')
  })

  it('falls back to the default when the paste holds no chapter header', async () => {
    const user = userEvent.setup()
    const page = renderNewDeckPage()

    await user.click(page.box())
    await user.paste('Zeus, King of the gods')

    expect(page.name().value).toBe('New Deck')
  })
})
