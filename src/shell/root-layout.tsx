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
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 bg-primary"
        style={{ height: 'env(safe-area-inset-top)', zIndex: 'var(--ms-z-nav)' }}
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
