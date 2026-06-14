import { lazy, Suspense } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'

// Dev-only router devtools, lazy so they never reach the production bundle.
const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  ),
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const routeTree = rootRoute.addChildren([homeRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
