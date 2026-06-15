/**
 * Fisher–Yates shuffle returning a new array (never mutates the input). `random`
 * is injectable so callers can seed it for deterministic tests; it defaults to
 * `Math.random`.
 */
export function shuffle<T>(input: readonly T[], random: () => number = Math.random): T[] {
  const out = [...input]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}
