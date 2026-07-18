import { useState } from 'react'
import { Outlet } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { AppNav } from './app-nav'
import { SplashOverlay } from './splash-overlay'
import { UpdatePrompt } from './update-prompt'

export function RootLayout() {
  const [showSplash, setShowSplash] = useState(true)
  return (
    <>
      {/* Owns the pixels behind the status text when iOS runs the app edge-to-edge: iOS 26
          standalone ignores both status-bar metas and tints the bar via WebKit's
          fixed-container edge sampling (LocalFrameView::fixedContainerEdges) — a hit test at
          the top-edge midpoint picks the topmost fixed/sticky, ~viewport-wide, opaque element
          and paints the bar with its background-color. That imposes two constraints here:
          the cap must stay hit-testable (never pointer-events-none — shipped WebKit honors
          pointer-events in that hit test, skips a non-hit-testable cap, and lets a toast
          sliding through the forehead become the sampled container, flipping the bar white),
          and z-statusbar must keep it topmost so both the hit test and the eye land on it.
          Collapses to 0 height wherever the top inset is 0 (opaque status bar, desktop). */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 bg-status-bar"
        style={{ height: 'env(safe-area-inset-top)', zIndex: 'var(--ms-z-statusbar)' }}
      />
      <Outlet />
      <AppNav />
      <UpdatePrompt />
      <AnimatePresence>
        {showSplash ? <SplashOverlay onDone={() => setShowSplash(false)} /> : null}
      </AnimatePresence>
    </>
  )
}
