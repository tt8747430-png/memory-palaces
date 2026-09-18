import { type CleanableCard, cleanedBack } from '../model/reference-backs'

/**
 * Rewrites the backs through `save`, which the caller wires to the core card command so the
 * edit syncs and logs a pending change like any other.
 */
export async function cleanReferenceBacks(
  cards: readonly CleanableCard[],
  save: (id: string, back: string) => Promise<void>,
): Promise<number> {
  const edits = cards.flatMap((card) => {
    const back = cleanedBack(card)
    return back ? [{ id: card.id, back }] : []
  })
  await Promise.all(edits.map((edit) => save(edit.id, edit.back)))
  return edits.length
}
