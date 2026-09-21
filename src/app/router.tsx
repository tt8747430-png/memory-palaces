import {
  type AnyRoute,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  type RouteComponent,
} from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import type { ExtensionRoute } from '@/shared/lib'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import type { Services } from './composition-root'
import { isExtensionFeatureOn, selectEffectivePreferences } from '@/entities/preferences'
import { ExtensionGate } from './extensions/ExtensionGate'
import { extensionOverview } from './extensions/extension-redirect'
import { extensionRedirect } from './extensions/extension-redirect'
import { EXTENSIONS } from './extensions/registry'
import { lazyScreen } from './lazy-screen'
import { validateExtensionsSearch } from '@/pages/settings-extensions'
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

/**
 * An extension's routes render inside its gate, a pathless layout that swaps them for Settings if the
 * extension goes off while one is open. Each is guarded on the way in: the guard **awaits the
 * runtime settling on loaded preferences** — `beforeLoad` runs before any provider has rendered, and
 * an unloaded store is not "off"; without the wait a cold deep link to an enabled extension would be
 * bounced. A route that names a feature is guarded on that too: switched off, it is not opened, and
 * the learner lands on the extension's overview where the switch is. An extension's overview screen
 * is one of its routes like any other, and each stays a lazy route component, so the router
 * preloads it on intent like any other.
 *
 * `AnyRoute`, because a manifest declares its paths at runtime: the type system cannot know them,
 * and inferring from their `string` would blur every core route's params with them.
 */
const extensionRoutes = EXTENSIONS.map((manifest): AnyRoute => {
  const gate = createRoute({
    getParentRoute: () => rootRoute,
    id: `extension-${manifest.id}`,
    component: () => <ExtensionGate id={manifest.id} />,
  })
  const screen = (declared: ExtensionRoute) =>
    createRoute({
      getParentRoute: () => gate,
      path: declared.path,
      validateSearch: declared.validateSearch,
      component: lazyScreen(declared.load)(declared.name),
      beforeLoad: async ({ context }) => {
        const { extensions, preferencesStore } = context.services
        await extensions.settled()
        const target = extensionRedirect(manifest.id, extensions.isActive(manifest.id))
        if (target) throw redirect(target)
        if (
          declared.feature &&
          !isExtensionFeatureOn(
            selectEffectivePreferences(preferencesStore.getState()),
            manifest.id,
            declared.feature,
          )
        ) {
          throw redirect(extensionOverview(manifest))
        }
      },
    })
  return gate.addChildren(
    [...manifest.routes, ...(manifest.overview ? [manifest.overview.route] : [])].map(screen),
  )
})

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
  createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.settingsExtensions,
    validateSearch: validateExtensionsSearch,
    component: settings('SettingsExtensionsScreen'),
  }),
  route(ROUTES.settingsSwipe, settings('SettingsSwipeScreen')),
  route(ROUTES.settingsSelect, settings('SettingsSelectScreen')),
  route(ROUTES.settingsHelp, settings('SettingsHelpScreen')),
  route(ROUTES.settingsAbout, settings('SettingsAboutScreen')),

  route(
    ROUTES.devKitchenSink,
    lazyScreen(() => import('./routes/kitchen-sink-screen'))('KitchenSinkScreen'),
  ),

  ...extensionRoutes,
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
