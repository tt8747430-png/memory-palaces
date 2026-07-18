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
      <Outlet />
      <AppNav />
      <UpdatePrompt />
      <AnimatePresence>
        {showSplash ? <SplashOverlay onDone={() => setShowSplash(false)} /> : null}
      </AnimatePresence>
    </>
  )
}
