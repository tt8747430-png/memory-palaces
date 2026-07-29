/**
 * `set` with `value` flipped in or out, as a fresh set. Every expander,
 * checklist and filter in the app toggles membership through here rather than
 * spelling out the copy/has/delete/add dance, so none of them can forget the copy.
 */
export function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set)
  if (!next.delete(value)) next.add(value)
  return next
}
