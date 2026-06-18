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
      {/* Opaque navy fill behind the iOS status bar. With `black-translucent` the web
          view runs under the status bar, so this keeps that safe-area strip on-brand
          (readable white system text) on every screen instead of an iOS white repaint.
          Collapses to 0 height where there's no top inset (no notch / desktop). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[400] bg-primary"
        style={{ height: 'env(safe-area-inset-top)' }}
      />
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
