import { useServices } from '@/shell/services-provider'
import { useStore } from '@/shared/data/use-store'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/shared/ui/empty'

/**
 * P0 placeholder proving the stack end to end (RxDB → repository → store →
 * Observable → useSyncExternalStore → React). No ViewModel: it owns no derived
 * state or orchestration yet, so it reads the store directly (no-middle-man
 * rule). P1 replaces it with the real deck library.
 */
export function DeckLibraryPage() {
  const { deckStore } = useServices()
  const decks = useStore(deckStore.entities)

  if (decks.length === 0)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No decks yet</EmptyTitle>
          <EmptyDescription>Create your first deck to start studying.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  return (
    <ul className="flex flex-col gap-2 p-4">
      {decks.map((deck) => (
        <li key={deck.id}>{deck.name}</li>
      ))}
    </ul>
  )
}
