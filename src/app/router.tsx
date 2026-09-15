import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  type RouteComponent,
} from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import type { Services } from './composition-root'
import { lazyScreen } from './lazy-screen'
import { validateRecoverySearch, validateStudySearch } from './routes/search'

export interface RouterContext {
  services: Services
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    const { services } = context
    const { session, status } = services.sessionStore.getState()
    const kind =
      status === 'ready'
        ? (session?.kind ?? null)
        : ((await services.authGateway.getCurrent())?.kind ?? null)
    const target = authRedirect(location.pathname, kind)
    if (target && target !== location.pathname) throw redirect({ to: target })
  },
})

const auth = lazyScreen(() => import('./routes/auth-screens'))
const deck = lazyScreen(() => import('./routes/deck-screens'))
const library = lazyScreen(() => import('./routes/library-screens'))
const profile = lazyScreen(() => import('./routes/profile-screens'))
const settings = lazyScreen(() => import('./routes/settings-screens'))

const route = <Path extends string>(path: Path, component: RouteComponent) =>
  createRoute({ getParentRoute: () => rootRoute, path, component })

const routeTree = rootRoute.addChildren([
  route(ROUTES.login, auth('LoginScreen')),
  route(ROUTES.signup, auth('SignupScreen')),
  route(ROUTES.forgot, auth('ForgotScreen')),
  route(ROUTES.authCallback, auth('AuthCallbackScreen')),
  route(ROUTES.welcome, auth('WelcomeScreen')),

  route(ROUTES.home, library('HomeScreen')),
  route(ROUTES.folder, library('FolderScreen')),
  route(ROUTES.archived, library('ArchivedScreen')),
  route(ROUTES.notifications, library('NotificationsScreen')),

  route(ROUTES.deckDetail, deck('DeckDetailScreen')),
  route(ROUTES.deckSettings, deck('DeckSettingsScreen')),
  route(ROUTES.deckAlgorithm, deck('DeckAlgorithmScreen')),
  route(ROUTES.deckAlgorithmAdvanced, deck('DeckAdvancedScreen')),
  route(ROUTES.deckCardStyle, deck('DeckCardStyleScreen')),
  route(ROUTES.deckTts, deck('DeckTtsScreen')),
  createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.deckStudy,
    validateSearch: validateStudySearch,
    component: deck('DeckStudyScreen'),
  }),
  route(ROUTES.deckMatch, deck('DeckMatchScreen')),
  route(ROUTES.deckQuiz, deck('DeckQuizScreen')),
  route(ROUTES.deckQuestions, deck('DeckQuestionsScreen')),
  route(ROUTES.deckQuestionNew, deck('QuestionNewScreen')),
  route(ROUTES.deckQuestionEdit, deck('QuestionEditScreen')),
  route(ROUTES.deckPaste, deck('DeckPasteScreen')),
  route(ROUTES.newPaste, deck('NewPasteScreen')),
  route(ROUTES.deckImport, deck('DeckImportScreen')),
  route(ROUTES.deckCardNew, deck('CardNewScreen')),
  route(ROUTES.deckCardEdit, deck('CardEditScreen')),

  route(ROUTES.profile, profile('ProfileScreen')),
  route(ROUTES.streak, profile('StreakScreen')),
  route(ROUTES.badges, profile('BadgesScreen')),
  route(ROUTES.badgeDetail, profile('BadgeDetailScreen')),
  route(ROUTES.achievements, profile('AchievementsScreen')),
  route(ROUTES.achievementDetail, profile('AchievementDetailScreen')),

  route(ROUTES.settings, settings('SettingsScreen')),
  route(ROUTES.settingsProfile, settings('SettingsProfileScreen')),
  createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.settingsChangePassword,
    validateSearch: validateRecoverySearch,
    component: settings('SettingsChangePasswordScreen'),
  }),
  route(ROUTES.settingsSync, settings('SettingsSyncScreen')),
  route(ROUTES.settingsPrivacy, settings('SettingsPrivacyScreen')),
  route(ROUTES.settingsSwipe, settings('SettingsSwipeScreen')),
  route(ROUTES.settingsSelect, settings('SettingsSelectScreen')),
  route(ROUTES.settingsHelp, settings('SettingsHelpScreen')),
  route(ROUTES.settingsAbout, settings('SettingsAboutScreen')),

  route(
    ROUTES.devKitchenSink,
    lazyScreen(() => import('./routes/kitchen-sink-screen'))('KitchenSinkScreen'),
  ),
])

export const createAppRouter = (services: Services) =>
  createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: false,
    context: { services },
  })

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
