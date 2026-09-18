import type { ReactNode } from 'react'
import { started } from '@/shared/test/started'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository, LocalObjectUrlStorage } from '@/shared/api'
import { StoragePortContext } from '@/shared/lib'
import { createSessionStore, type Session, SessionStoreContext } from '@/entities/session'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createQuestionStore, type Question, QuestionStoreContext } from '@/entities/question'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext, makeFolder } from '@/entities/folder'
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
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

const latin = makeFolder({ id: 'f1', createdAt: at(0), name: 'Latin', color: 'sky', icon: '📁' })

function renderLibrary({
  decks = [] as Deck[],
  folders = [] as Folder[],
  folderId = null as string | null,
  onFolderGone = vi.fn(),
} = {}) {
  const preferences = preferencesStoreHolding(null)
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <PreferencesStoreContext value={preferences}>
          <StoragePortContext value={new LocalObjectUrlStorage()}>
            <SessionStoreContext value={createSessionStore(new InMemoryRepository<Session>())}>
              <FolderStoreContext
                value={started(createFolderStore(new InMemoryRepository<Folder>(folders)))}
              >
                <DeckStoreContext
                  value={started(createDeckStore(new InMemoryRepository<Deck>(decks)))}
                >
                  <CardStoreContext
                    value={started(createCardStore(new InMemoryRepository<Card>([])))}
                  >
                    <QuestionStoreContext
                      value={started(createQuestionStore(new InMemoryRepository<Question>()))}
                    >
                      {children}
                    </QuestionStoreContext>
                  </CardStoreContext>
                </DeckStoreContext>
              </FolderStoreContext>
            </SessionStoreContext>
          </StoragePortContext>
        </PreferencesStoreContext>
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

  it('selects a held deck together with its subdecks', async () => {
    const { result } = renderLibrary({
      decks: [deck('root'), deck('child', { parentId: 'root' })],
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.selection.begin('root'))
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

  it('moving a selected deck out of its folder keeps its subdecks under it', async () => {
    const { result } = renderLibrary({
      decks: [
        deck('root', { folderId: 'f1' }),
        deck('child', { parentId: 'root' }),
        deck('leaf', { parentId: 'child' }),
      ],
      folders: [latin],
      folderId: 'f1',
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.selection.begin('root'))
    act(() => result.current.selectHandlers.unfile!.onAction())

    await waitFor(() =>
      expect(result.current.decks.find((d) => d.id === 'root')?.folderId).toBeNull(),
    )
    const parents = Object.fromEntries(result.current.decks.map((d) => [d.id, d.parentId]))
    expect(parents).toEqual({ root: null, child: 'root', leaf: 'child' })
  })

  it('moving a selection into a deck carries each deck with its subdecks', async () => {
    const { result } = renderLibrary({
      decks: [deck('root'), deck('child', { parentId: 'root' }), deck('target', { order: 1 })],
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.selection.begin('root'))
    act(() => result.current.act.bulkMoveTo({ kind: 'deck', deckId: 'target' }))

    await waitFor(() =>
      expect(result.current.decks.find((d) => d.id === 'root')?.parentId).toBe('target'),
    )
    expect(result.current.decks.find((d) => d.id === 'child')?.parentId).toBe('root')
  })

  it('confirming a folder delete deletes the decks filed in it', async () => {
    const onFolderGone = vi.fn()
    const { result } = renderLibrary({
      decks: [deck('inside', { folderId: 'f1' }), deck('outside', { order: 1 })],
      folders: [latin],
      onFolderGone,
    })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.request({ kind: 'delete-folder', folder: latin }))
    act(() => result.current.confirm())

    await waitFor(() => expect(result.current.decks.map((d) => d.id)).toEqual(['outside']))
    expect(result.current.folders).toEqual([])
  })

  it('a reorder shows up immediately, before the writes settle', async () => {
    const { result } = renderLibrary({ decks: [deck('a'), deck('b', { order: 1 })] })
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.act.reorderDeckIds(['b', 'a']))

    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['b', 'a'])
    await waitFor(() => expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['b', 'a']))
  })

  it('an empty scope reports itself as empty', async () => {
    const folder = makeFolder({
      id: 'f1',
      createdAt: at(0),
      name: 'Latin',
      color: 'sky',
      icon: '📁',
    })
    const { result } = renderLibrary({ folders: [folder], folderId: 'f1' })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.sectionFolders).toEqual([])
  })
})
