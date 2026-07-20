import { describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@/shared/i18n'
import { createTestServices } from '@/composition-root'
import type { Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { OverlayHost } from '@/shared/ui'
import { makeCard } from '@/decks/model/card'
import { makeDeck } from '@/decks/model/deck'
import type { SrsState } from '@/shared/domain'
import { useDeckContent, type UseDeckContentOptions } from './use-deck-content'

const AT = '2026-07-16T00:00:00.000Z'
const DAY = 86_400_000
const NOW = Date.parse(AT)
const iso = (ms: number) => new Date(ms).toISOString()

function wrapperFor(services: Services) {
  return ({ children }: { children: React.ReactNode }) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  )
}

/** A schedule mature enough that `srsStatus` calls it `known`. */
const knownSrs = (): SrsState => ({
  due: iso(NOW + 30 * DAY),
  interval: 30,
  ease: 2.5,
  reps: 6,
  lapses: 0,
  lastReviewed: iso(NOW),
})

async function arrange(cards: { id: string; front: string; order: number; srs?: SrsState }[]) {
  const services = createTestServices()
  services.deckStore.start()
  services.cardStore.start()
  services.preferencesStore.start()
  await services.deckStore.save(makeDeck({ id: 'd1', createdAt: AT, name: 'Garden' }))
  for (const card of cards) {
    await services.cardStore.save(
      makeCard({
        id: card.id,
        createdAt: AT,
        deckId: 'd1',
        front: card.front,
        back: `${card.front} back`,
        order: card.order,
        srs: card.srs,
      }),
    )
  }
  return services
}

function renderVm(services: Services, over: Partial<UseDeckContentOptions> = {}) {
  const options: UseDeckContentOptions = {
    deckId: 'd1',
    selectMode: false,
    onSelectModeChange: () => {},
    sort: 'manual',
    onSortChange: () => {},
    onPasteNotes: () => {},
    onReviewImport: () => {},
    ...over,
  }
  return renderHook(() => useDeckContent(options), { wrapper: wrapperFor(services) })
}

describe('useDeckContent', () => {
  it('narrows visibleCards to the chosen maturity, leaving the deck total alone', async () => {
    const services = await arrange([
      { id: 'c1', front: 'fresh', order: 0 },
      { id: 'c2', front: 'mature', order: 1, srs: knownSrs() },
    ])
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.total).toBe(2))

    act(() => {
      result.current.applyFilter({ maturity: new Set(['known']), flaggedOnly: false })
    })

    expect(result.current.visibleCards.map((card) => card.id)).toEqual(['c2'])
    // The maturity summary describes the deck, not the filtered view.
    expect(result.current.total).toBe(2)
    expect(result.current.filterCount).toBe(1)
  })

  it('reorders through the bulk command, persisting one order per id', async () => {
    const services = await arrange([
      { id: 'c1', front: 'first', order: 0 },
      { id: 'c2', front: 'second', order: 1 },
      { id: 'c3', front: 'third', order: 2 },
    ])
    const onSortChange = vi.fn()
    const { result } = renderVm(services, { sort: 'manual', onSortChange })
    await waitFor(() => expect(result.current.total).toBe(3))

    act(() => {
      result.current.onReorder(['c3', 'c1', 'c2'])
    })

    await waitFor(() => {
      const byId = new Map(services.cardStore.cards().map((card) => [card.id, card]))
      expect(byId.get('c3')?.order).toBe(0)
      expect(byId.get('c1')?.order).toBe(1)
      expect(byId.get('c2')?.order).toBe(2)
    })
    // Already manual — the VM must not thrash the sort back to itself.
    expect(onSortChange).not.toHaveBeenCalled()
  })

  it('switches a non-manual sort to manual when the learner drags a row', async () => {
    const services = await arrange([
      { id: 'c1', front: 'first', order: 0 },
      { id: 'c2', front: 'second', order: 1 },
    ])
    const onSortChange = vi.fn()
    const { result } = renderVm(services, { sort: 'name', onSortChange })
    await waitFor(() => expect(result.current.total).toBe(2))

    act(() => {
      result.current.onReorder(['c2', 'c1'])
    })

    expect(onSortChange).toHaveBeenCalledWith('manual')
  })

  it('shows a just-dropped order immediately, before the store has caught up', async () => {
    const services = await arrange([
      { id: 'c1', front: 'first', order: 0 },
      { id: 'c2', front: 'second', order: 1 },
    ])
    const { result } = renderVm(services)
    await waitFor(() => expect(result.current.total).toBe(2))

    act(() => {
      result.current.onReorder(['c2', 'c1'])
    })

    // Synchronously after the drop — the optimistic patch, not the persisted rows.
    expect(result.current.visibleCards.map((card) => card.id)).toEqual(['c2', 'c1'])
  })

  it('deletes the whole selection through one bulk command and leaves select mode', async () => {
    const services = await arrange([
      { id: 'c1', front: 'one', order: 0 },
      { id: 'c2', front: 'two', order: 1 },
      { id: 'c3', front: 'three', order: 2 },
    ])
    const onSelectModeChange = vi.fn()
    render(
      <ServicesProvider services={services}>
        <OverlayHost />
      </ServicesProvider>,
    )
    const { result } = renderVm(services, { selectMode: true, onSelectModeChange })
    await waitFor(() => expect(result.current.total).toBe(3))

    act(() => {
      result.current.toggleSelect('c1')
      result.current.toggleSelect('c2')
    })
    expect(result.current.selectedCount).toBe(2)

    act(() => {
      void result.current.deleteSelected()
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(services.cardStore.cards().map((card) => card.id)).toEqual(['c3'])
    })
    expect(onSelectModeChange).toHaveBeenCalledWith(false)
  })

  it('selects and clears every visible card, ignoring those a filter hides', async () => {
    const services = await arrange([
      { id: 'c1', front: 'fresh', order: 0 },
      { id: 'c2', front: 'mature', order: 1, srs: knownSrs() },
    ])
    const { result } = renderVm(services, { selectMode: true })
    await waitFor(() => expect(result.current.total).toBe(2))

    act(() => {
      result.current.applyFilter({ maturity: new Set(['known']), flaggedOnly: false })
    })
    act(() => {
      result.current.toggleSelectAll()
    })

    expect([...result.current.selectedIds]).toEqual(['c2'])
    expect(result.current.allVisibleSelected).toBe(true)
  })

  it('searches across front, back, hint and tip', async () => {
    const services = await arrange([
      { id: 'c1', front: 'alpha', order: 0 },
      { id: 'c2', front: 'beta', order: 1 },
    ])
    const { result } = renderVm(services, { searchQuery: '  ALPHA ' })
    await waitFor(() => expect(result.current.total).toBe(2))

    expect(result.current.visibleCards.map((card) => card.id)).toEqual(['c1'])
    // A search makes the on-screen list a subset, so dragging it would mean nothing.
    expect(result.current.reorderable).toBe(false)
  })
})
