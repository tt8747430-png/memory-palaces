import type { ReactNode } from 'react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { createDeckStore, type Deck, DeckStoreContext, makeDeck } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { useDeckSettings } from './use-deck-settings'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

afterEach(() => vi.restoreAllMocks())

function setup(deckOverrides: { archived?: boolean } = {}) {
  const deck = makeDeck({
    id: 'd1',
    createdAt: new Date(0).toISOString(),
    name: 'Physics',
    archived: deckOverrides.archived ?? false,
  })
  const repo = new InMemoryRepository<Deck>([deck])
  const deckStore = started(createDeckStore(repo))
  const cardStore = started(createCardStore(new InMemoryRepository<Card>()))
  const folderStore = started(createFolderStore(new InMemoryRepository<Folder>()))

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      FolderStoreContext,
      { value: folderStore },
      createElement(
        CardStoreContext,
        { value: cardStore },
        createElement(DeckStoreContext, { value: deckStore }, children),
      ),
    )

  const nav = { onArchived: vi.fn(), onDeleted: vi.fn(), onReviewImport: vi.fn() }
  const hook = renderHook(() => useDeckSettings('d1', nav), { wrapper })
  return { hook, repo, nav }
}

describe('useDeckSettings', () => {
  it('holds one pending confirmation at a time', async () => {
    const { hook } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.ask('duplicate'))
    expect(hook.result.current.confirming).toBe('duplicate')

    act(() => hook.result.current.ask('delete'))
    expect(hook.result.current.confirming).toBe('delete')
  })

  it('runs nothing until the confirmation is answered', async () => {
    const { hook, repo } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.ask('duplicate'))
    expect(await repo.getAll()).toHaveLength(1)

    act(() => hook.result.current.confirm())
    await waitFor(async () => expect(await repo.getAll()).toHaveLength(2))
  })

  /**
   * The reason this goes through `usePendingAct`: `ConfirmDialog` fires `onConfirm` before it
   * closes, so two taps landing in the same frame would otherwise copy the deck twice.
   */
  it('runs a double-tapped confirm exactly once', async () => {
    const { hook, repo } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.ask('duplicate'))
    act(() => {
      hook.result.current.confirm()
      hook.result.current.confirm()
    })

    await waitFor(async () => expect(await repo.getAll()).toHaveLength(2))
    expect(await repo.getAll()).toHaveLength(2)
  })

  it('archives on confirmation and leaves the screen behind', async () => {
    const { hook, repo, nav } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.ask('archive'))
    act(() => hook.result.current.confirm())

    await waitFor(async () => expect((await repo.getById('d1'))?.archived).toBe(true))
    expect(nav.onArchived).toHaveBeenCalled()
  })

  it('restores without asking, and stays put', async () => {
    const { hook, repo, nav } = setup({ archived: true })
    await waitFor(() => expect(hook.result.current.ready).toBe(true))
    expect(hook.result.current.archiving).toBe(false)

    act(() => hook.result.current.act.toggleArchived())

    await waitFor(async () => expect((await repo.getById('d1'))?.archived).toBe(false))
    expect(nav.onArchived).not.toHaveBeenCalled()
  })

  /** Picking "archive" as a move destination is the archive act, so it asks the same question. */
  it('asks before archiving from the move sheet', async () => {
    const { hook, repo } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.act.move({ kind: 'archive' }))
    expect(hook.result.current.confirming).toBe('archive')
    expect((await repo.getById('d1'))?.archived).toBe(false)

    act(() => hook.result.current.confirm())
    await waitFor(async () => expect((await repo.getById('d1'))?.archived).toBe(true))
  })

  /**
   * The archive is where an archived deck already is, so picking it changes nothing — the row's
   * label says "Archive", and confirming it would have restored the deck instead.
   */
  it('does nothing when an archived deck is moved to the archive', async () => {
    const { hook, repo, nav } = setup({ archived: true })
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.open('move'))
    act(() => hook.result.current.act.move({ kind: 'archive' }))

    expect(hook.result.current.confirming).toBeNull()
    expect(hook.result.current.sheet).toBeNull()
    expect((await repo.getById('d1'))?.archived).toBe(true)
    expect(nav.onArchived).not.toHaveBeenCalled()
  })

  it('dismisses only the confirmation the dialog belongs to', async () => {
    const { hook } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.ask('delete'))
    act(() => hook.result.current.onConfirmOpenChange('archive')(false))
    expect(hook.result.current.confirming).toBe('delete')

    act(() => hook.result.current.onConfirmOpenChange('delete')(false))
    expect(hook.result.current.confirming).toBeNull()
  })

  it('closes the open sheet on dismissal and ignores the rest', async () => {
    const { hook } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.open('export'))
    act(() => hook.result.current.onSheetOpenChange('export')(true))
    expect(hook.result.current.sheet).toBe('export')

    act(() => hook.result.current.onSheetOpenChange('export')(false))
    expect(hook.result.current.sheet).toBeNull()
  })

  /**
   * A sheet on its way out fires `onOpenChange(false)` after the next one has opened — the export
   * sheet must not be able to close the move sheet that replaced it.
   */
  it('lets a sheet close only itself', async () => {
    const { hook } = setup()
    await waitFor(() => expect(hook.result.current.ready).toBe(true))

    act(() => hook.result.current.open('export'))
    act(() => hook.result.current.open('move'))
    act(() => hook.result.current.onSheetOpenChange('export')(false))
    expect(hook.result.current.sheet).toBe('move')

    act(() => hook.result.current.onSheetOpenChange('move')(false))
    expect(hook.result.current.sheet).toBeNull()
  })
})
