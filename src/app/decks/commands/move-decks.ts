import { canReparent } from '@app/shared/domain'
import type { DeckStore } from '@app/decks/data/stores'
import { moveDeck } from './move-deck'

/**
 * Move a selection of decks under a new parent, into a folder, or back to the
 * root (`parentId` and `folderId` both null — what the UI calls "unfile").
 *
 * A deck cannot move into its own subtree. `moveDeck` throws on that; across a
 * selection it is skipped instead, because a bulk move is best-effort — one
 * impossible destination shouldn't abandon the rest. Returns the ids actually
 * moved so the caller can report an honest count.
 *
 * Moves run in sequence: each one derives its `order` from the destination's
 * current siblings, so issuing them in parallel would race for the same slot.
 */
export async function moveDecks(
  store: DeckStore,
  ids: readonly string[],
  parentId: string | null,
  folderId: string | null = null,
): Promise<readonly string[]> {
  const moved: string[] = []
  for (const id of ids) {
    if (!canReparent(store.decks(), id, parentId)) continue
    await moveDeck(store, id, parentId, folderId)
    moved.push(id)
  }
  return moved
}
