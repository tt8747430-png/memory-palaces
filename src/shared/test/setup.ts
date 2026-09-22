import '@testing-library/jest-dom/vitest'

if (typeof Element !== 'undefined' && typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
}

if (typeof window !== 'undefined' && !('onpointerdown' in window)) {
  Object.defineProperty(window, 'onpointerdown', { value: null, writable: true })
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

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

/**
 * jsdom lays nothing out: every box is 0 × 0. A list that draws only the rows in view reads two
 * boxes — the screen's scroll element and each drawn row — so those two, and nothing else, get a
 * size here: the scroll element is the window, and a row is a nominal card's height. A test then
 * sees what a phone sees: a screenful of rows, not the whole list and not none of it.
 */
const TEST_ROW_HEIGHT = 100

if (typeof HTMLElement !== 'undefined') {
  const jsdomHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
  const jsdomWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (this.hasAttribute('data-screen-scroll')) return window.innerHeight
      if (this.hasAttribute('data-index')) return TEST_ROW_HEIGHT
      return jsdomHeight?.get?.call(this) ?? 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      if (this.hasAttribute('data-screen-scroll')) return window.innerWidth
      return jsdomWidth?.get?.call(this) ?? 0
    },
  })
}

// jsdom lays nothing out, so it never implemented scrolling an element into view.
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {}
}
