import { createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
import { PalacesPage } from '@/pages/palaces'
import { PalaceDetailPage } from '@/pages/palace-detail'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'

const rootRoute = createRootRoute({ component: RootLayout })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  component: HomePage,
})

// Thin wrappers keep the pages router-free (and unit-testable): the route reads
// params + supplies navigation callbacks; the page just renders.
function PalacesRoute() {
  const navigate = useNavigate()
  return (
    <PalacesPage
      onOpenPalace={(palaceId) => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
    />
  )
}

const palacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaces,
  component: PalacesRoute,
})

function PalaceDetailRoute() {
  const { palaceId } = palaceDetailRoute.useParams()
  const navigate = useNavigate()
  return <PalaceDetailPage palaceId={palaceId} onBack={() => navigate({ to: ROUTES.palaces })} />
}

const palaceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceDetail,
  component: PalaceDetailRoute,
})

const routeTree = rootRoute.addChildren([homeRoute, palacesRoute, palaceDetailRoute])

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
