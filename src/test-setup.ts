// Vitest + jsdom global setup for every unit test.
import 'fake-indexeddb/auto'

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
