/**
 * Narrows whatever an image field is carrying to the object **path** the private buckets speak.
 *
 * The migration's read-side twin, and the repo already knows why one is not enough: `database.ts`
 * records it for card styles — a device still on the old schema pushes the old value, and
 * replication writes pulled rows straight into the collection without running a migration strategy.
 * So a deck cover written by an un-migrated device arrives here as a full public URL, and without
 * this it would render as unavailable on every other device.
 *
 * Three cases, and the third is the one that matters:
 *
 * - a public storage URL → its `<userId>/<entityId>` path;
 * - an inline `data:` value → untouched. An inline image is a waypoint, not a URL, and
 *   `reconcileInlineImages` still owns moving it out;
 * - anything else → **returned as-is**, never discarded. An unrecognised string is more likely a
 *   value a future version understands than garbage worth throwing away.
 */
const PUBLIC_OBJECT = /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/

export function coerceImagePath(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('data:')) return value
  const match = PUBLIC_OBJECT.exec(value)
  if (!match?.[1]) return value
  // A signed URL carries its token in the query string; the path stops at the `?`.
  return decodeURIComponent(match[1].split('?')[0] ?? match[1])
}
