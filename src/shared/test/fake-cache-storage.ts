export function fakeCacheStorage(seeded: Record<string, Response> = {}) {
  const entries = new Map<string, Response>(Object.entries(seeded))
  const cache = {
    match: async (key: string) => entries.get(key)?.clone(),
    put: async (key: string, response: Response) => void entries.set(key, response),
    delete: async (key: string) => entries.delete(key),
  }
  return { entries, caches: { open: async () => cache } as unknown as CacheStorage }
}
