import { describe, it, expect } from 'vitest'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DragEndEvent } from '@dnd-kit/core'
import '@/shared/i18n'
import { createTestServices } from '@/composition-root'
import type { Services } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { OverlayHost } from '@/shared/ui'
import { makeDeck } from '@/decks/model/deck'
import { useDeckLibrary } from './use-deck-library'

function wrapperFor(services: Services) {
  return ({ children }: { children: React.ReactNode }) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  )
}

/** A minimal fake matching only the fields `onDragEnd`/`dropIntentFor` actually read. */
function dragEndEvent(activeId: string, overId: string, pointerY: number): DragEndEvent {
  return {
    active: {
      id: activeId,
      rect: { current: { translated: { top: pointerY, left: 0, width: 100, height: 10 } } },
    },
    over: { id: overId, rect: { top: 0, height: 100, left: 0, width: 100 } },
  } as unknown as DragEndEvent
}

describe('useDeckLibrary', () => {
  it('reorders decks when a drag ends over the seam above another deck', async () => {
    const services = createTestServices()
    services.deckStore.start()
    services.folderStore.start()
    services.cardStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'a', createdAt: '2026-07-16T00:00:00.000Z', name: 'A', order: 0 }),
    )
    await services.deckStore.save(
      makeDeck({ id: 'b', createdAt: '2026-07-16T00:00:00.000Z', name: 'B', order: 1 }),
    )

    const { result } = renderHook(() => useDeckLibrary({ onOpenDeck: () => {} }), {
      wrapper: wrapperFor(services),
    })

    // Drag B to the top 10% of A's row — a seam ("before"), not a nest.
    act(() => {
      result.current.onDragEnd(dragEndEvent('b', 'a', 5))
    })

    await waitFor(() => {
      const byId = new Map(services.deckStore.decks().map((d) => [d.id, d]))
      expect(byId.get('b')?.order).toBe(0)
      expect(byId.get('a')?.order).toBe(1)
    })
  })

  it('archives every selected deck via the bulk command and exits select mode', async () => {
    const services = createTestServices()
    services.deckStore.start()
    services.folderStore.start()
    services.cardStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'a', createdAt: '2026-07-16T00:00:00.000Z', name: 'A' }),
    )
    await services.deckStore.save(
      makeDeck({ id: 'b', createdAt: '2026-07-16T00:00:00.000Z', name: 'B' }),
    )

    const { result } = renderHook(() => useDeckLibrary({ onOpenDeck: () => {} }), {
      wrapper: wrapperFor(services),
    })

    act(() => result.current.enterSelect('a'))
    act(() => result.current.toggleSelect('b'))
    expect(result.current.selectMode).toBe(true)
    expect(result.current.selectedCount).toBe(2)

    act(() => result.current.bulk.archive())

    await waitFor(() => {
      expect(services.deckStore.decks().every((d) => d.archived)).toBe(true)
    })
    expect(result.current.selectMode).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('confirmDeleteDeck deletes the deck once the confirm dialog is accepted', async () => {
    const services = createTestServices()
    services.deckStore.start()
    services.folderStore.start()
    services.cardStore.start()
    const deck = await services.deckStore.save(
      makeDeck({ id: 'a', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    render(
      <ServicesProvider services={services}>
        <OverlayHost />
      </ServicesProvider>,
    )
    const { result } = renderHook(() => useDeckLibrary({ onOpenDeck: () => {} }), {
      wrapper: wrapperFor(services),
    })

    act(() => {
      void result.current.confirmDeleteDeck(deck)
    })

    const confirmButton = await screen.findByRole('button', { name: 'Delete deck' })
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(services.deckStore.decks().find((d) => d.id === 'a')).toBeUndefined()
    })
  })
})
