import type { Routes } from '@angular/router'
import { authGuard } from './auth/auth.guard'

/** Feature-area pages register here as their port lands (ADR-0006, Phase 6). */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./decks/pages/deck-library-page').then((m) => m.DeckLibraryPage),
  },
  {
    path: 'archived',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./decks/pages/archived-decks-page').then((m) => m.ArchivedDecksPage),
  },
  {
    path: 'decks/:deckId',
    canActivate: [authGuard],
    loadComponent: () => import('./decks/pages/deck-detail-page').then((m) => m.DeckDetailPage),
  },
  {
    path: 'decks/:deckId/settings',
    canActivate: [authGuard],
    loadComponent: () => import('./decks/pages/deck-settings-page').then((m) => m.DeckSettingsPage),
  },
  {
    path: 'decks/:deckId/cards/new',
    canActivate: [authGuard],
    loadComponent: () => import('./decks/pages/card-editor-page').then((m) => m.CardEditorPage),
  },
  {
    path: 'decks/:deckId/cards/:cardId',
    canActivate: [authGuard],
    loadComponent: () => import('./decks/pages/card-editor-page').then((m) => m.CardEditorPage),
  },
  {
    path: 'decks/:deckId/questions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./decks/pages/deck-questions-page').then((m) => m.DeckQuestionsPage),
  },
  {
    path: 'decks/:deckId/questions/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./decks/pages/question-editor-page').then((m) => m.QuestionEditorPage),
  },
  {
    path: 'decks/:deckId/questions/:questionId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./decks/pages/question-editor-page').then((m) => m.QuestionEditorPage),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./notifications/pages/notifications-page').then((m) => m.NotificationsPage),
  },
  {
    path: 'login',
    canActivate: [authGuard],
    loadComponent: () => import('./auth/pages/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [authGuard],
    loadComponent: () => import('./auth/pages/signup-page').then((m) => m.SignupPage),
  },
  {
    path: 'forgot',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/pages/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'welcome',
    canActivate: [authGuard],
    loadComponent: () => import('./auth/pages/welcome-page').then((m) => m.WelcomePage),
  },
  // Unported legacy destinations land home until their area's port arrives (ADR-0006).
  { path: '**', redirectTo: '' },
]
