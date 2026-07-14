// Vitest + jsdom global setup for every unit test.
import 'fake-indexeddb/auto'

// Node >= 22 defines a global localStorage that throws unless started with
// --localstorage-file, and jsdom's own localStorage can be unusable on opaque
// origins. Probe for a working implementation; fall back to an in-memory one.
function workingStorage(): Storage | null {
  try {
    const candidate = window.localStorage
    candidate.setItem('__probe__', '1')
    candidate.removeItem('__probe__')
    return candidate
  } catch {
    return null
  }
}

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, String(value)),
  }
}

if (typeof window !== 'undefined') {
  const storage = workingStorage() ?? memoryStorage()
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
}

// jsdom has no matchMedia; Taiga UI's dark-mode token queries it at injection time.
const noop = (): void => undefined

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: noop,
      removeEventListener: noop,
      addListener: noop,
      removeListener: noop,
      dispatchEvent: () => false,
    }) as MediaQueryList
}
