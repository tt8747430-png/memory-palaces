import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { DevPreviewPage } from './DevPreviewPage'

beforeAll(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ''
    thresholds = []
  } as unknown as typeof IntersectionObserver
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

afterEach(cleanup)

describe('DevPreviewPage', () => {
  it('renders every section, each from its own module', () => {
    renderWithProviders(<DevPreviewPage />)

    for (const title of [
      'Keyboard & viewport',
      'Overlays & sheets',
      'Colour row — ring clipping',
      'Swipe row',
      'Buttons & actions',
      'Inputs & fields',
      'Selection & toggles',
      'Feedback & status',
      'Data display',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
  })
})
