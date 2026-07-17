import { createBrowserRouter } from 'react-router'
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
          const { DeckLibraryPage } = await import('@/decks/pages/deck-library-page')
          return { Component: DeckLibraryPage }
        },
      },
    ],
  },
])
