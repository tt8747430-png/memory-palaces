import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import '@/shared/i18n'
import { RootLayout } from './root-layout'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}))

afterEach(cleanup)

function renderLayout() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route element={<div />} index />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RootLayout status-bar cap', () => {
  // iOS 26 tints the standalone status bar from the element a WebKit hit test finds at the
  // top-edge midpoint (fixed-container edge sampling). The cap only wins that hit test while
  // it is hit-testable, fixed, viewport-wide, and topmost — each assertion below is one of
  // the sampler's candidate requirements, not styling taste.
  it('stays hit-testable, fixed, full-width, and above toasts', () => {
    const { container } = renderLayout()
    const cap = container.querySelector('.bg-status-bar')

    expect(cap).not.toBeNull()
    expect(cap!.className).not.toContain('pointer-events-none')
    expect(cap!.className).toContain('fixed')
    expect(cap!.className).toContain('inset-x-0')
    expect(cap!.className).toContain('top-0')

    // jsdom's CSSOM drops the env()-valued height, so only the z pin is assertable here.
    expect((cap as HTMLElement).style.zIndex).toBe('var(--ms-z-statusbar)')
  })

  it('hides the cap from the accessibility tree', () => {
    const { container } = renderLayout()
    expect(container.querySelector('.bg-status-bar')).toHaveAttribute('aria-hidden')
  })
})
