// Vitest + jsdom global setup for every unit test.
import 'fake-indexeddb/auto'

// jsdom has no matchMedia; Taiga UI's dark-mode token queries it at injection time.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
