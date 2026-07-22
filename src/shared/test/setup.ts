import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement the Pointer Capture API, which `@use-gesture` (SwipeRow, study/browser
// decks) calls unguarded on pointer-down. Stub it so gesture-bound rows don't crash under test.
if (typeof Element !== 'undefined' && typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
}

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

// jsdom has no ResizeObserver; CardFace measures its layout with one (self-guarded in prod).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
