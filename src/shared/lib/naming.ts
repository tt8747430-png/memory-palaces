/**
 * Pick the next free "Base N" name given the names already in use — e.g. `New Deck 1`, then
 * `New Deck 2` once the first exists. Case-insensitive so `new deck 1` still counts as taken.
 * Used to pre-fill create forms so a name is never required from scratch.
 */
export function nextDefaultName(base: string, existing: Iterable<string>): string {
  const taken = new Set<string>()
  for (const name of existing) taken.add(name.trim().toLowerCase())
  for (let n = 1; ; n++) {
    const candidate = `${base} ${n}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
}
