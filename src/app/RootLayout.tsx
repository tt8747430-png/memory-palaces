import { lazy, Suspense, useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import { AppNav } from '@/widgets/bottom-nav'
import { SplashOverlay } from '@/widgets/splash'

// Dev-only router devtools, lazy so they never reach the production bundle.
const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

/** Root route shell: a once-per-cold-start splash over the routed outlet, plus the
 * bottom nav (self-hiding on non-tab routes) and dev-only devtools. */
export function RootLayout() {
  const [showSplash, setShowSplash] = useState(true)
  return (
    <>
      <Outlet />
      <AppNav />
      <AnimatePresence>
        {showSplash ? <SplashOverlay onDone={() => setShowSplash(false)} /> : null}
      </AnimatePresence>
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
