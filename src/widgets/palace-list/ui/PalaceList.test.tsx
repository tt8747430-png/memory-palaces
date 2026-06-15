import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makePalace, type Palace } from '@/entities/palace'
import { PalaceList } from './PalaceList'

afterEach(cleanup)

const palace = (id: string, name: string): Palace =>
  makePalace({ id, createdAt: new Date(0).toISOString(), name })

function renderList(props: Partial<Parameters<typeof PalaceList>[0]> = {}) {
  const handlers = { onRename: vi.fn(), onDelete: vi.fn(), onDuplicate: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      <PalaceList palaces={[]} {...handlers} {...props} />
    </I18nextProvider>,
  )
  return handlers
}

describe('PalaceList', () => {
  it('shows an empty state when there are no palaces', () => {
    renderList({ palaces: [] })
    expect(screen.getByText(/no palaces/i)).toBeInTheDocument()
  })

  it('renders each palace by name', () => {
    renderList({ palaces: [palace('a', 'Alpha'), palace('b', 'Beta')] })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('invokes onDelete and onDuplicate for the targeted palace', async () => {
    const user = userEvent.setup()
    const handlers = renderList({ palaces: [palace('a', 'Alpha')] })

    await user.click(screen.getByRole('button', { name: /delete alpha/i }))
    await user.click(screen.getByRole('button', { name: /duplicate alpha/i }))

    expect(handlers.onDelete).toHaveBeenCalledWith('a')
    expect(handlers.onDuplicate).toHaveBeenCalledWith('a')
  })

  it('renames inline, passing the trimmed new name', async () => {
    const user = userEvent.setup()
    const handlers = renderList({ palaces: [palace('a', 'Alpha')] })

    await user.click(screen.getByRole('button', { name: /rename alpha/i }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '  Acropolis  ')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(handlers.onRename).toHaveBeenCalledWith('a', 'Acropolis')
  })
})
