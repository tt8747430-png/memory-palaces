import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
import { PalacesPage } from '@/pages/palaces'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'

const rootRoute = createRootRoute({ component: RootLayout })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  component: HomePage,
})

const palacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaces,
  component: PalacesPage,
})

const routeTree = rootRoute.addChildren([homeRoute, palacesRoute])

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
