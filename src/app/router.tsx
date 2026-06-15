import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'

const rootRoute = createRootRoute({ component: RootLayout })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
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
