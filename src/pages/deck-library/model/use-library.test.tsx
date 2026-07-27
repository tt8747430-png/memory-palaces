import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext, makeFolder } from '@/entities/folder'
import { useLibrary } from './use-library'

afterEach(cleanup)

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/shared/lib/haptics', () => ({
  impact: vi.fn(),
  tick: vi.fn(),
  success: vi.fn(),
  setHapticsEnabled: vi.fn(),
}))

const at = (ms: number) => new Date(ms).toISOString()

const deck = (id: string, over: Partial<Deck> = {}) => ({
  ...makeDeck({ id, createdAt: at(0), name: id.toUpperCase() }),
  ...over,
})

function renderLibrary({
  decks = [] as Deck[],
  folders = [] as Folder[],
  folderId = null as string | null,
  onFolderGone = vi.fn(),
} = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <FolderStoreContext value={createFolderStore(new InMemoryRepository<Folder>(folders))}>
          <DeckStoreContext value={createDeckStore(new InMemoryRepository<Deck>(decks))}>
            <CardStoreContext value={createCardStore(new InMemoryRepository<Card>([]))}>
              {children}
            </CardStoreContext>
          </DeckStoreContext>
        </FolderStoreContext>
      </I18nextProvider>
    )
  }
  const view = renderHook(() => useLibrary(folderId, onFolderGone), { wrapper: Wrapper })
  return { ...view, onFolderGone }
}

describe('useLibrary', () => {
  it('reports the scope it was given once the stores have emitted', async () => {
    const { result } = renderLibrary({ decks: [deck('a'), deck('b', { order: 1 })] })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['a', 'b'])
  })

  it('sends the route away when the folder it names is not there', async () => {
    const { onFolderGone } = renderLibrary({ folderId: 'gone' })
    await waitFor(() => expect(onFolderGone).toHaveBeenCalled())
  })

  // Selecting a deck takes its whole subtree, because select mode is flat: a subdeck is never
  // on screen there, so leaving it behind would silently exclude it from every bulk action.
  it('selects a held deck together with its subdecks', async () => {
    const { result } = renderLibrary({
      decks: [deck('root'), deck('child', { parentId: 'root' })],
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.selection.beginDeck('root'))
    expect(result.current.selection.active).toBe(true)
    expect([...result.current.selection.ids].sort()).toEqual(['child', 'root'])
  })

  it('holds one pending act at a time, so a move cannot open over a delete', async () => {
    const { result } = renderLibrary({ decks: [deck('a')] })
    await waitFor(() => expect(result.current.ready).toBe(true))
    const target = result.current.decks[0]!

    act(() => result.current.request({ kind: 'delete-deck', deck: target }))
    expect(result.current.pending).toEqual({ kind: 'delete-deck', deck: target })

    act(() => result.current.request({ kind: 'move-deck', deck: target }))
    expect(result.current.pending?.kind).toBe('move-deck')

    act(() => result.current.dismiss())
    expect(result.current.pending).toBeNull()
  })

  it('confirming a pending delete removes the deck and clears the act', async () => {
    const { result } = renderLibrary({ decks: [deck('a'), deck('b', { order: 1 })] })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.request({ kind: 'delete-deck', deck: result.current.decks[0]! }))
    act(() => result.current.confirm())

    expect(result.current.pending).toBeNull()
    await waitFor(() => expect(result.current.decks.map((d) => d.id)).toEqual(['b']))
  })

  it('excludes a moving deck and its descendants from its own destinations', async () => {
    const { result } = renderLibrary({
      decks: [deck('root'), deck('child', { parentId: 'root' }), deck('other', { order: 1 })],
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    const root = result.current.decks.find((d) => d.id === 'root')!

    act(() => result.current.request({ kind: 'move-deck', deck: root }))

    expect([...result.current.moveExcludeIds].sort()).toEqual(['child', 'root'])
  })

  it('a reorder shows up immediately, before the writes settle', async () => {
    const { result } = renderLibrary({ decks: [deck('a'), deck('b', { order: 1 })] })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.act.reorderDeckIds(['b', 'a']))

    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['b', 'a'])
    await waitFor(() => expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['b', 'a']))
  })

  it('an empty scope reports itself as empty', async () => {
    const folder = makeFolder({ id: 'f1', createdAt: at(0), name: 'Latin', color: 'sky', icon: '📁' })
    const { result } = renderLibrary({ folders: [folder], folderId: 'f1' })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.isEmpty).toBe(true)
    // Inside a folder the library shows no folder rows — folders don't nest.
    expect(result.current.sectionFolders).toEqual([])
  })
})
