import { createBrowserRouter, redirect, type RouteObject } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from '@/shell/root-layout'
import { RouteErrorBoundary } from '@/shell/route-error-boundary'

/**
 * Destinations the deck hub links to that later phases build (P2 practice, P8 import). Wiring the
 * paths now keeps every intent a real navigation; until the page exists it lands back home rather
 * than on the 404 boundary. Each entry is deleted as its page lands.
 */
const PLACEHOLDER_ROUTES: RouteObject[] = [
  ROUTES.deckStudy,
  ROUTES.deckCardNew,
  ROUTES.deckCardEdit,
  ROUTES.deckQuestionNew,
  ROUTES.deckQuestionEdit,
  ROUTES.deckPaste,
  ROUTES.deckImport,
].map((path) => ({ path, loader: () => redirect(ROUTES.home) }))

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
        path: ROUTES.deckDetail,
        lazy: async () => {
          const { default: DeckDetailRoute } = await import('@/decks/pages/deck-detail-route')
          return { Component: DeckDetailRoute }
        },
      },
      {
        path: ROUTES.deckQuestions,
        lazy: async () => {
          const { default: DeckQuestionsRoute } = await import('@/decks/pages/deck-questions-route')
          return { Component: DeckQuestionsRoute }
        },
      },
      {
        path: ROUTES.archived,
        lazy: async () => {
          const { default: ArchivedDecksRoute } = await import('@/decks/pages/archived-decks-route')
          return { Component: ArchivedDecksRoute }
        },
      },
      {
        path: ROUTES.deckSettings,
        lazy: async () => {
          const { default: DeckSettingsRoute } = await import('@/decks/pages/deck-settings-route')
          return { Component: DeckSettingsRoute }
        },
      },
      {
        path: ROUTES.deckQuiz,
        lazy: async () => {
          const { default: QuizRoute } = await import('@/practice/pages/quiz-route')
          return { Component: QuizRoute }
        },
      },
      {
        path: ROUTES.deckMatch,
        lazy: async () => {
          const { default: MatchRoute } = await import('@/practice/pages/match-route')
          return { Component: MatchRoute }
        },
      },
      ...PLACEHOLDER_ROUTES,
    ],
  },
])
