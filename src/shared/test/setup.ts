import '@testing-library/jest-dom/vitest'

// This toolchain's jsdom doesn't expose Web Storage, so provide a minimal in-memory
// localStorage. Adapters/components persist through it under test exactly as in the browser.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  const memoryStorage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  } as unknown as Storage

  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true })
  if (typeof window !== 'undefined' && !window.localStorage) {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true })
  }
}
