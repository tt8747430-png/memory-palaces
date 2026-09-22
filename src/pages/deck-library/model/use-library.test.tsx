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
import { type Preferences, PreferencesStoreContext } from '@/entities/preferences'
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
  prefs = null as Partial<Preferences> | null,
} = {}) {
  const preferences = preferencesStoreHolding(prefs)
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

describe('useLibrary ordering', () => {
  const named = (id: string, name: string, order: number, createdAt = 0) => ({
    ...makeDeck({ id, createdAt: at(createdAt), name }),
    order,
  })

  it('leaves the rows where they were dragged under the manual order', async () => {
    const { result } = renderLibrary({
      decks: [named('v', 'Verbs', 0), named('a', 'Adjectives', 1)],
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.sectionDecks.map((d) => d.name)).toEqual(['Verbs', 'Adjectives'])
  })

  it('arranges the rows by the order that was chosen', async () => {
    const { result } = renderLibrary({
      decks: [named('v', 'Verbs', 0), named('a', 'Adjectives', 1)],
      prefs: { deckSort: 'name' },
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.sectionDecks.map((d) => d.name)).toEqual(['Adjectives', 'Verbs'])
  })

  it('reaches the rows nested under a deck, and stops at the top when told to', async () => {
    const decks = [
      named('root', 'Root', 0),
      { ...named('v', 'Verbs', 0), parentId: 'root' },
      { ...named('a', 'Adjectives', 1), parentId: 'root' },
    ]
    const nested = renderLibrary({ decks, prefs: { deckSort: 'name' } })
    await waitFor(() => expect(nested.result.current.ready).toBe(true))
    act(() => nested.result.current.toggleExpanded('root'))
    expect(nested.result.current.rows.map((r) => r.id)).toEqual(['root', 'a', 'v'])
    nested.unmount()

    const topOnly = renderLibrary({
      decks,
      prefs: { deckSort: 'name', deckSortSubdecks: false },
    })
    await waitFor(() => expect(topOnly.result.current.ready).toBe(true))
    act(() => topOnly.result.current.toggleExpanded('root'))
    expect(topOnly.result.current.rows.map((r) => r.id)).toEqual(['root', 'v', 'a'])
  })

  it('only lets a drag reorder rows that are in the manual order', async () => {
    const decks = [
      named('root', 'Root', 0),
      { ...named('v', 'Verbs', 0), parentId: 'root' },
      { ...named('a', 'Adjectives', 1), parentId: 'root' },
    ]
    const manual = renderLibrary({ decks })
    await waitFor(() => expect(manual.result.current.ready).toBe(true))
    expect(manual.result.current.canReorderDecks).toBe(true)
    manual.unmount()

    const byName = renderLibrary({ decks, prefs: { deckSort: 'name' } })
    await waitFor(() => expect(byName.result.current.ready).toBe(true))
    expect(byName.result.current.canReorderDecks).toBe(false)
  })

  it('sorts one deck’s subdecks on their own, which takes the Library order off every subdeck', async () => {
    const decks = [
      named('root', 'Root', 0),
      { ...named('v', 'Verbs', 0), parentId: 'root' },
      { ...named('a', 'Adjectives', 1), parentId: 'root' },
    ]
    const { result } = renderLibrary({ decks, prefs: { deckSort: 'manual' } })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.allSubdecks).toBe(true)

    act(() => result.current.sortSubdecks('root'))
    expect(result.current.selection.active).toBe(true)
    expect(result.current.scope?.name).toBe('Root')
    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['v', 'a'])
    expect(result.current.deckSort).toBe('manual')

    act(() => result.current.setDeckSort('name'))
    await waitFor(() => expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['a', 'v']))
    expect(result.current.deckSort).toBe('name')
    expect(result.current.allSubdecks).toBe(false)
    expect(result.current.canReorderDecks).toBe(false)

    // Leaving the selection leaves the scope: the Library is whole again, still manual at the top.
    act(() => result.current.selection.exit())
    expect(result.current.scope).toBeNull()
    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['root'])
    expect(result.current.deckSort).toBe('manual')
  })

  it('asking for the Library order on all subdecks forgets every order chosen for one deck', async () => {
    const decks = [
      named('root', 'Root', 0),
      { ...named('v', 'Verbs', 0), parentId: 'root' },
      { ...named('a', 'Adjectives', 1), parentId: 'root' },
    ]
    const { result } = renderLibrary({
      decks,
      prefs: { deckSort: 'manual', deckSortSubdecks: false, subdeckSorts: { root: 'name' } },
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.toggleExpanded('root'))
    expect(result.current.rows.map((r) => r.id)).toEqual(['root', 'a', 'v'])

    act(() => result.current.setAllSubdecks(true))
    await waitFor(() => expect(result.current.rows.map((r) => r.id)).toEqual(['root', 'v', 'a']))
    expect(result.current.allSubdecks).toBe(true)
  })

  it('shows only the favourites when asked, and says how many it is hiding', async () => {
    const decks = [
      named('v', 'Verbs', 0),
      { ...named('a', 'Adjectives', 1), favorite: true },
      named('n', 'Nouns', 2),
    ]
    const { result } = renderLibrary({ decks })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.filter).toBe('all')
    expect(result.current.hidden).toBe(0)

    act(() => result.current.setFilter('favorites'))
    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['a'])
    expect(result.current.hidden).toBe(2)

    // Select all reaches only what is shown.
    act(() => result.current.selection.enter())
    act(() => result.current.selection.toggleAll())
    expect([...result.current.selection.ids]).toEqual(['a'])
  })

  it('writes a drag over the whole level, so a row the filter hid keeps its slot', async () => {
    const decks = [
      named('v', 'Verbs', 0),
      { ...named('a', 'Adjectives', 1), favorite: true },
      named('n', 'Nouns', 2),
      { ...named('z', 'Zebra', 3), favorite: true },
    ]
    const { result } = renderLibrary({ decks })
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.setFilter('favorites'))
    expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['a', 'z'])

    // Dragged among what was on screen: Zebra above Adjectives. Verbs and Nouns were hidden.
    act(() => result.current.act.reorderDeckIds(['z', 'a']))

    act(() => result.current.setFilter('all'))
    await waitFor(() =>
      expect(result.current.sectionDecks.map((d) => d.id)).toEqual(['v', 'z', 'n', 'a']),
    )
  })

  it('falls back to the manual order for a contributed order nobody is offering', async () => {
    const { result } = renderLibrary({
      decks: [named('v', 'Verbs', 0), named('a', 'Adjectives', 1)],
      prefs: { deckSort: 'bible:canon' },
    })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.sectionDecks.map((d) => d.name)).toEqual(['Verbs', 'Adjectives'])
    expect(result.current.deckSort).toBe('manual')
  })
})
