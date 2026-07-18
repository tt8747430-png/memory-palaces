import { createBrowserRouter, redirect } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from '@/shell/root-layout'
import { RouteErrorBoundary } from '@/shell/route-error-boundary'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: DeckLibraryRoute } = await import('@/decks/pages/deck-library-route')
          return { Component: DeckLibraryRoute }
        },
      },
      {
        // Placeholder until the archived-decks page lands (P1c) — keeps the
        // header's archive shortcut from hitting the 404 error boundary.
        path: ROUTES.archived,
        loader: () => redirect(ROUTES.home),
      },
    ],
  },
])
