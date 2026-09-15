export type Divergence = 'clean' | 'mergeable' | 'destructive'

export interface PendingLike {
  op: 'save' | 'remove'
}

export function classifyChange(
  pending: PendingLike | undefined,
  remote: { deleted: boolean },
): Divergence {
  if (!pending) return 'clean'
  if (pending.op === 'save') return 'mergeable'
  return remote.deleted ? 'clean' : 'destructive'
}

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
