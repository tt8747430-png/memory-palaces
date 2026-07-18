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
      {/* Owns the pixels behind the status text when iOS runs the app edge-to-edge: recent iOS
          ignores both status-bar metas in standalone and derives the bar tint from page pixels
          (WebKit 300965), so the shell paints the forehead itself. z-statusbar keeps it above
          every in-app layer — a toast sliding through the forehead must never repaint the bar.
          Collapses to 0 height wherever the top inset is 0 (opaque status bar, desktop). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 bg-status-bar"
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
