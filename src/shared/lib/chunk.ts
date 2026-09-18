/** `[1,2,3,4,5]` by 2 → `[[1,2],[3,4],[5]]`. For a request that must not name a thousand ids. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error(`Chunk size must be at least 1: ${size}`)
  const chunks: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size))
  }
  return chunks
}
