/**
 * `set` with `value` flipped in or out, as a fresh set. Every expander, checklist and filter
 * toggles membership through here instead of respelling the copy/has/delete/add dance, so none of
 * them can forget the copy.
 */
export function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set)
  if (!next.delete(value)) next.add(value)
  return next
}
