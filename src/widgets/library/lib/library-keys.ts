/** Namespaced library keys — `f:<id>` / `p:<id>` — shared by the grid's dnd ids and the
 * persisted mixed folder/palace order, so a key's kind is always unambiguous. */
export const folderKey = (id: string) => `f:${id}`
export const palaceKey = (id: string) => `p:${id}`

export function parseLibraryKey(raw: string): { kind: 'f' | 'p'; id: string } {
  return { kind: raw.slice(0, 1) as 'f' | 'p', id: raw.slice(2) }
}
