import type { Routes } from '@angular/router'
import { authGuard } from './auth/auth.guard'

/** Feature-area pages register here as their port lands (ADR-0006, Phase 6). */
export const routes: Routes = [
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
]
