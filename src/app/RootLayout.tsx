import { lazy, Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'
import { AppNav } from '@/widgets/bottom-nav'

// Dev-only router devtools, lazy so they never reach the production bundle.
const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

/** Root route shell: the routed outlet, the bottom nav (self-hiding on non-tab routes), and
 * dev-only devtools. The cold-start brand moment is the OS launch image plus the boot splash
 * in index.html, so there is no in-app splash here. */
export function RootLayout() {
  return (
    <>
      {/* Navy fill behind the top safe-area inset, so the notch/status-bar strip stays
          on-brand in the browser (where the page runs edge-to-edge under the notch).
          Collapses to 0 in the standalone app — the `black` status bar reserves that space —
          and on screens with no top inset. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[400] bg-primary"
        style={{ height: 'env(safe-area-inset-top)' }}
      />
      <Outlet />
      <AppNav />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
