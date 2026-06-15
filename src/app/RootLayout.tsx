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

/** Root route shell: the routed outlet plus dev-only devtools. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <AppNav />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
