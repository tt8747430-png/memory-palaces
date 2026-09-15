/**
 * Cache Storage for tests. jsdom has none, and a fake missing one method turns every call to it
 * into an error the code under test is right to swallow — which is how a test passes against a
 * cache that was never written. So all four methods the image cache uses are here.
 *
 * Test-only: nothing in the app imports it.
 */
export function fakeCacheStorage(seeded: Record<string, Response> = {}) {
  const entries = new Map<string, Response>(Object.entries(seeded))
  const cache = {
    match: async (key: string) => entries.get(key)?.clone(),
    put: async (key: string, response: Response) => void entries.set(key, response),
    delete: async (key: string) => entries.delete(key),
  }
  return { entries, caches: { open: async () => cache } as unknown as CacheStorage }
}
