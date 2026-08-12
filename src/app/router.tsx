import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import { services } from './composition-root'
import {
  AuthCallbackScreen,
  ForgotScreen,
  LoginScreen,
  SignupScreen,
  WelcomeScreen,
} from './routes/auth-screens'
import {
  CardEditorScreen,
  DeckDetailScreen,
  DeckImportScreen,
  DeckMatchScreen,
  DeckPasteScreen,
  DeckQuestionsScreen,
  DeckQuizScreen,
  DeckSettingsScreen,
  DeckStudyScreen,
  NewPasteScreen,
  QuestionEditorScreen,
} from './routes/deck-screens'
import {
  ArchivedScreen,
  HomeScreen,
  LibraryScreen,
  NotificationsScreen,
} from './routes/library-screens'
import {
  AchievementDetailScreen,
  AchievementsScreen,
  BadgeDetailScreen,
  BadgesScreen,
  ProfileScreen,
  StreakScreen,
} from './routes/profile-screens'
import {
  SettingsAboutScreen,
  SettingsChangePasswordScreen,
  SettingsHelpScreen,
  SettingsPrivacyScreen,
  SettingsProfileScreen,
  SettingsScreen,
  SettingsSelectScreen,
  SettingsSwipeScreen,
} from './routes/settings-screens'

const rootRoute = createRootRoute({
  component: RootLayout,
  // A cloud session is restored asynchronously (stored token, then a refresh), so the guard awaits
  // the gateway instead of reading a synchronous snapshot that would be null on first paint.
  beforeLoad: async ({ location }) => {
    const auth = await services.authGateway.getCurrent()
    const target = authRedirect(location.pathname, auth?.kind ?? null)
    if (target && target !== location.pathname) throw redirect({ to: target })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.login,
  component: LoginScreen,
})
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.signup,
  component: SignupScreen,
})
const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.forgot,
  component: ForgotScreen,
})
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.authCallback,
  component: AuthCallbackScreen,
})
const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.welcome,
  component: WelcomeScreen,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  component: HomeScreen,
})
const archivedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.archived,
  component: ArchivedScreen,
})
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.notifications,
  component: NotificationsScreen,
})

const folderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.folder,
  component: function Folder() {
    return <LibraryScreen folderId={folderRoute.useParams().folderId} />
  },
})

const deckDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckDetail,
  component: function DeckDetail() {
    return <DeckDetailScreen {...deckDetailRoute.useParams()} />
  },
})

const deckSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckSettings,
  component: function DeckSettings() {
    return <DeckSettingsScreen {...deckSettingsRoute.useParams()} />
  },
})

const deckStudyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckStudy,
  component: function DeckStudy() {
    return <DeckStudyScreen {...deckStudyRoute.useParams()} />
  },
})

const deckMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckMatch,
  component: function DeckMatch() {
    return <DeckMatchScreen {...deckMatchRoute.useParams()} />
  },
})

const deckQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuiz,
  component: function DeckQuiz() {
    return <DeckQuizScreen {...deckQuizRoute.useParams()} />
  },
})

const deckQuestionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuestions,
  component: function DeckQuestions() {
    return <DeckQuestionsScreen {...deckQuestionsRoute.useParams()} />
  },
})

const deckQuestionNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuestionNew,
  component: function DeckQuestionNew() {
    return <QuestionEditorScreen {...deckQuestionNewRoute.useParams()} />
  },
})

const deckQuestionEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuestionEdit,
  component: function DeckQuestionEdit() {
    return <QuestionEditorScreen {...deckQuestionEditRoute.useParams()} />
  },
})

const deckPasteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckPaste,
  component: function DeckPaste() {
    return <DeckPasteScreen {...deckPasteRoute.useParams()} />
  },
})

const newPasteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.newPaste,
  component: NewPasteScreen,
})

const deckImportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckImport,
  component: function DeckImport() {
    return <DeckImportScreen {...deckImportRoute.useParams()} />
  },
})

const deckCardNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckCardNew,
  component: function DeckCardNew() {
    return <CardEditorScreen {...deckCardNewRoute.useParams()} />
  },
})

const deckCardEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckCardEdit,
  component: function DeckCardEdit() {
    return <CardEditorScreen {...deckCardEditRoute.useParams()} />
  },
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.profile,
  component: ProfileScreen,
})
const streakRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.streak,
  component: StreakScreen,
})
const badgesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.badges,
  component: BadgesScreen,
})
const achievementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.achievements,
  component: AchievementsScreen,
})

const badgeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.badgeDetail,
  component: function BadgeDetail() {
    return <BadgeDetailScreen {...badgeDetailRoute.useParams()} />
  },
})

const achievementDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.achievementDetail,
  component: function AchievementDetail() {
    return <AchievementDetailScreen {...achievementDetailRoute.useParams()} />
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings,
  component: SettingsScreen,
})
const settingsProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsProfile,
  component: SettingsProfileScreen,
})
const settingsChangePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsChangePassword,
  component: SettingsChangePasswordScreen,
})
const settingsPrivacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsPrivacy,
  component: SettingsPrivacyScreen,
})
const settingsSwipeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsSwipe,
  component: SettingsSwipeScreen,
})
const settingsSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsSelect,
  component: SettingsSelectScreen,
})
const settingsHelpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsHelp,
  component: SettingsHelpScreen,
})
const settingsAboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsAbout,
  component: SettingsAboutScreen,
})

const kitchenSinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.devKitchenSink,
  component: lazyRouteComponent(() => import('./routes/kitchen-sink-screen'), 'KitchenSinkScreen'),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  forgotRoute,
  authCallbackRoute,
  welcomeRoute,
  homeRoute,
  folderRoute,
  archivedRoute,
  deckDetailRoute,
  deckSettingsRoute,
  deckStudyRoute,
  deckMatchRoute,
  deckQuizRoute,
  deckQuestionsRoute,
  deckQuestionNewRoute,
  deckQuestionEditRoute,
  deckPasteRoute,
  newPasteRoute,
  deckImportRoute,
  deckCardNewRoute,
  deckCardEditRoute,
  profileRoute,
  streakRoute,
  badgesRoute,
  badgeDetailRoute,
  achievementsRoute,
  achievementDetailRoute,
  settingsRoute,
  settingsProfileRoute,
  settingsChangePasswordRoute,
  settingsPrivacyRoute,
  settingsSwipeRoute,
  settingsSelectRoute,
  settingsHelpRoute,
  settingsAboutRoute,
  notificationsRoute,
  kitchenSinkRoute,
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
