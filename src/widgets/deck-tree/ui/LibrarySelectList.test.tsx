import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeDeck } from '@/entities/deck'
import { makeFolder } from '@/entities/folder'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { LibrarySelectList } from './LibrarySelectList'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

const deck = (id: string, name: string, order: number, parentId: string | null = null) =>
  makeDeck({ id, createdAt: CREATED, name, order, parentId })

function baseProps(
  overrides: Partial<Parameters<typeof LibrarySelectList>[0]> = {},
): Parameters<typeof LibrarySelectList>[0] {
  return {
    folders: [],
    decks: [],
    allDecks: overrides.decks ?? [],
    cards: [],
    folderDeckCounts: new Map(),
    selectedIds: new Set<string>(),
    onToggleSelect: vi.fn(),
    onReorderFolders: vi.fn(),
    onReorderDecks: vi.fn(),
    onFileDecks: vi.fn(),
    headings: new Map(),
    // The rows are in the manual order unless a test says otherwise.
    canReorderDecks: true,
    canReorderFolders: true,
    ...overrides,
  }
}

describe('LibrarySelectList', () => {
  it('shows only the rows it was given — subdecks never reach it', () => {
    const decks = [deck('a', 'First', 0)]
    renderWithProviders(
      <LibrarySelectList
        {...baseProps({ decks, allDecks: [...decks, deck('a1', 'Nested', 0, 'a')] })}
      />,
    )

    expect(screen.getByRole('button', { name: 'Select First' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Select Nested' })).not.toBeInTheDocument()
  })

  it('offers no expand control, so there is nothing to unfold', () => {
    const decks = [deck('a', 'First', 0)]
    renderWithProviders(
      <LibrarySelectList
        {...baseProps({ decks, allDecks: [...decks, deck('a1', 'Nested', 0, 'a')] })}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collapse' })).not.toBeInTheDocument()
  })

  it('reflects the selected state and toggles on tap', async () => {
    const user = userEvent.setup()
    const onToggleSelect = vi.fn()
    const decks = [deck('a', 'First', 0), deck('b', 'Second', 1)]
    renderWithProviders(
      <LibrarySelectList {...baseProps({ decks, selectedIds: new Set(['a']), onToggleSelect })} />,
    )

    expect(screen.getByRole('button', { name: 'Select First' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Select Second' }))
    expect(onToggleSelect).toHaveBeenCalledWith('b')
  })

  it('prints the shelf a run of rows opens, in the host’s words', () => {
    const decks = [deck('g', 'Geneza', 0), deck('m', 'Matei', 1)]
    renderWithProviders(
      <LibrarySelectList
        {...baseProps({
          decks,
          headings: new Map([
            ['g', { id: 'old', labelKey: 'library.select.folders' }],
            ['m', { id: 'new', labelKey: 'library.select.decks' }],
          ]),
        })}
      />,
    )
    const text = screen.getByRole('list').textContent ?? ''
    expect(text.indexOf('Folders')).toBeLessThan(text.indexOf('Geneza'))
    expect(text.indexOf('Decks')).toBeLessThan(text.indexOf('Matei'))
    expect(text.indexOf('Geneza')).toBeLessThan(text.indexOf('Decks'))
  })

  it('takes the drag handle off a row whose order a drag may not write', () => {
    const decks = [deck('a', 'First', 0)]
    const { unmount } = renderWithProviders(
      <LibrarySelectList {...baseProps({ decks, canReorderDecks: true })} />,
    )
    expect(screen.getByRole('button', { name: 'Select First' })).toHaveAttribute(
      'aria-roledescription',
      'sortable',
    )
    unmount()

    renderWithProviders(<LibrarySelectList {...baseProps({ decks, canReorderDecks: false })} />)
    expect(screen.getByRole('button', { name: 'Select First' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('names the two sections only when both are on screen', () => {
    const folders = [
      makeFolder({
        id: 'f1',
        createdAt: CREATED,
        name: 'School',
        order: 0,
        color: '#4f7cff',
        icon: '📁',
      }),
    ]
    const decks = [deck('a', 'First', 0)]

    const { unmount } = renderWithProviders(
      <LibrarySelectList {...baseProps({ folders, decks })} />,
    )
    expect(screen.getByRole('heading', { name: 'Folders' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Decks' })).toBeInTheDocument()
    unmount()

    renderWithProviders(<LibrarySelectList {...baseProps({ decks })} />)
    expect(screen.queryByRole('heading', { name: 'Decks' })).not.toBeInTheDocument()
  })
})
