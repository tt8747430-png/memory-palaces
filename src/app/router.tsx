import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type RouteComponent,
} from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import { services } from './composition-root'
import { lazyScreen } from './lazy-screen'

const rootRoute = createRootRoute({
  component: RootLayout,
  /**
   * A cloud session is restored asynchronously, so the first navigation has to wait for the
   * gateway — a synchronous snapshot would be null on first paint and bounce a signed-in user to
   * the login screen. Every navigation after that reads the session store, which AuthProvider keeps
   * current, so routing never waits on the network again.
   */
  beforeLoad: async ({ location }) => {
    const { session, status } = services.sessionStore.getState()
    const kind =
      status === 'ready'
        ? (session?.kind ?? null)
        : ((await services.authGateway.getCurrent())?.kind ?? null)
    const target = authRedirect(location.pathname, kind)
    if (target && target !== location.pathname) throw redirect({ to: target })
  },
})

/**
 * Every screen is loaded on demand. The five `routes/*-screens` modules are the split points, so a
 * cold start on the login screen no longer carries the study engine, the drag-and-drop stack or
 * every settings page with it — `defaultPreload: 'intent'` fetches the chunk on hover or touch,
 * which lands well before the navigation does.
 *
 * Screens read their own params (`useParams({ from })`), which is what keeps this file free of
 * static imports of them.
 */
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
  route(ROUTES.deckStudy, deck('DeckStudyScreen')),
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
    // A recovery link lands here with no old password to give, so the screen must know it. Absent,
    // the flag stays off the URL rather than being written out as `?recovery=false`.
    validateSearch: (search: Record<string, unknown>): { recovery?: boolean } => {
      const recovery = search.recovery
      const on = recovery === true || recovery === '1' || recovery === 'true'
      return on ? { recovery: true } : {}
    },
    component: settings('SettingsChangePasswordScreen'),
  }),
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

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: false,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
