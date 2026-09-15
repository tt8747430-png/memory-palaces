/**
 * How a Sync decides whether the user has to be asked anything.
 *
 * The vocabulary matters and UBIQUITOUS_LANGUAGE fixes it: a **divergence** is the cloud and the
 * device both having changed since this device's last Sync, and is RxDB's **conflict** only in the
 * cases where one document arrived with two versions. Every conflict is inside a divergence; most
 * divergences contain no conflict at all, and almost none need a human.
 */
export type Divergence = 'clean' | 'mergeable' | 'destructive'

export interface PendingLike {
  op: 'save' | 'remove'
}

/**
 * One remote change, against what this device did to the same document.
 *
 * - nothing pending → **clean pull**: the device has no opinion, so the cloud copy simply arrives.
 * - pending `save`, and the cloud moved too → **mergeable**: the collection's `conflictHandler`
 *   settles it field by field and neither side loses a review.
 * - pending `remove`, and the cloud *deleted it too* → **clean**: both sides agree, there is nothing
 *   to ask.
 * - pending `remove`, and the cloud edited it → **destructive**: no merge can decide between a
 *   deletion and an edit, so this is the one shape that opens a dialog.
 *
 * A deletion with no matching remote change is deliberately **not** destructive, however large. If
 * the cloud has not moved, this device is the only author and its deletions push silently.
 */
export function classifyChange(
  pending: PendingLike | undefined,
  remote: { deleted: boolean },
): Divergence {
  if (!pending) return 'clean'
  if (pending.op === 'save') return 'mergeable'
  return remote.deleted ? 'clean' : 'destructive'
}

/** The parent ids a document hangs off: `deckId` for a card or question, `parentId` for a
 *  subdeck, `folderId` for a filed deck. */
export function parentIdsOf(doc: {
  deckId?: unknown
  parentId?: unknown
  folderId?: unknown
}): string[] {
  return [doc.deckId, doc.parentId, doc.folderId].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
}

export interface Parented {
  id: string
  deckId?: unknown
  parentId?: unknown
  folderId?: unknown
}

/**
 * Which of `candidates` sit anywhere under one of `roots`, and under which root.
 *
 * A fixpoint rather than one pass, because a subtree is deeper than one level: a card under a
 * subdeck under a deleted deck names the subdeck, not the deck, and only becomes reachable once the
 * subdeck has been found. Ids are uuids across every collection, so containers of different kinds
 * can share one set.
 */
export function descendantsOf(
  roots: readonly string[],
  candidates: readonly Parented[],
): Map<string, string> {
  const rootOf = new Map<string, string>(roots.map((root) => [root, root]))
  const found = new Map<string, string>()
  let grew = true
  while (grew) {
    grew = false
    for (const candidate of candidates) {
      if (found.has(candidate.id)) continue
      const parent = parentIdsOf(candidate).find((id) => rootOf.has(id))
      if (!parent) continue
      const root = rootOf.get(parent) as string
      found.set(candidate.id, root)
      rootOf.set(candidate.id, root)
      grew = true
    }
  }
  return found
}
