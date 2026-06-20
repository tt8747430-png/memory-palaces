import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { LoginPage } from '@/pages/login'
import { SignupPage } from '@/pages/signup'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { WelcomePage } from '@/pages/welcome'
import { HomePage } from '@/pages/home'
import { PalacesPage } from '@/pages/palaces'
import { PalaceDetailPage } from '@/pages/palace-detail'
import { RoomContentPage } from '@/pages/room-content'
import { RoomTrainPage } from '@/pages/room-train'
import { MatchPage } from '@/pages/match'
import { VerseStudyPage } from '@/pages/verse'
import { ReviewPage } from '@/pages/review'
import { QuizPage } from '@/pages/quiz'
import { ProfilePage } from '@/pages/profile'
import { StreakPage } from '@/pages/streak'
import { BadgesPage } from '@/pages/badges'
import { BadgeDetailPage } from '@/pages/badge-detail'
import { AchievementsPage } from '@/pages/achievements'
import { AchievementDetailPage } from '@/pages/achievement-detail'
import { SettingsPage, useProgressTransfer } from '@/pages/settings'
import { SettingsProfilePage } from '@/pages/settings-profile'
import { SettingsChangePasswordPage } from '@/pages/settings-change-password'
import { SettingsPrivacyPage } from '@/pages/settings-privacy'
import { SettingsHelpPage } from '@/pages/settings-help'
import { SettingsAboutPage } from '@/pages/settings-about'
import { NotificationsPage } from '@/pages/notifications'
import { useSessionStore } from '@/entities/session'
import { useAuthActions } from '@/features/session'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import { services } from './composition-root'

/**
 * Back handler that returns to the actual previous screen via history when there is
 * one, so a screen reached from different places goes back to wherever the user came
 * from (e.g. the profile badge → edit-profile → back lands on Profile, not Settings).
 * The `fallback` only runs on a fresh load / deep link with no in-app history.
 */
function useBack(fallback: () => void): () => void {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return () => {
    if (canGoBack) router.history.back()
    else fallback()
  }
}

const rootRoute = createRootRoute({
  component: RootLayout,
  // Session gate: the gateway (localStorage) is the source of truth, read
  // synchronously so the redirect resolves before any screen paints.
  beforeLoad: ({ location }) => {
    const target = authRedirect(
      location.pathname,
      services.authGateway.getPersisted()?.kind ?? null,
    )
    if (target && target !== location.pathname) throw redirect({ to: target })
  },
})

function LoginRoute() {
  const navigate = useNavigate()
  return (
    <LoginPage
      onAuthed={() => navigate({ to: ROUTES.home })}
      onGuest={() => navigate({ to: ROUTES.home })}
      onSignup={() => navigate({ to: ROUTES.signup })}
      onForgot={() => navigate({ to: ROUTES.forgot })}
    />
  )
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.login,
  component: LoginRoute,
})

function SignupRoute() {
  const navigate = useNavigate()
  return (
    <SignupPage
      onSuccess={() => navigate({ to: ROUTES.welcome })}
      onGuest={() => navigate({ to: ROUTES.home })}
      onLogin={() => navigate({ to: ROUTES.login })}
    />
  )
}

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.signup,
  component: SignupRoute,
})

function ForgotRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.login }))
  return <ForgotPasswordPage onBack={back} />
}

const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.forgot,
  component: ForgotRoute,
})

function WelcomeRoute() {
  const navigate = useNavigate()
  return <WelcomePage onContinue={() => navigate({ to: ROUTES.home })} />
}

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.welcome,
  component: WelcomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  return (
    <HomePage
      onStartReview={() => navigate({ to: ROUTES.review })}
      onOpenNotifications={() => navigate({ to: ROUTES.notifications })}
      onOpenProfile={() => navigate({ to: ROUTES.profile })}
      onTrainRoom={(roomId) => navigate({ to: ROUTES.roomTrain, params: { roomId } })}
      onOpenPalace={(palaceId) => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
      onViewAllPalaces={() => navigate({ to: ROUTES.palaces })}
      onCreatePalace={() => navigate({ to: ROUTES.palaces, search: { create: true } })}
    />
  )
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  component: HomeRoute,
})

// Thin wrappers keep the pages router-free (and unit-testable): the route reads
// params + supplies navigation callbacks; the page just renders.
function PalacesRoute() {
  const navigate = useNavigate()
  const { create } = palacesRoute.useSearch()
  return (
    <PalacesPage
      autoFocusCreate={create}
      onOpenPalace={(palaceId) => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
    />
  )
}

const palacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaces,
  // `?create` arrives from the home's "Create palace" CTA; it lands on the create field
  // focused and ready to type instead of dropping the user on a static list.
  validateSearch: (search: Record<string, unknown>): { create?: boolean } => ({
    create: search.create === true || search.create === 'true' ? true : undefined,
  }),
  component: PalacesRoute,
})

function PalaceDetailRoute() {
  const { palaceId } = palaceDetailRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.palaces }))
  return (
    <PalaceDetailPage
      palaceId={palaceId}
      onBack={back}
      onOpenRoom={(roomId) => navigate({ to: ROUTES.roomContent, params: { roomId } })}
      onTrainRoom={(roomId) => navigate({ to: ROUTES.roomTrain, params: { roomId } })}
      onQuiz={() => navigate({ to: ROUTES.palaceQuiz, params: { palaceId } })}
    />
  )
}

const palaceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceDetail,
  component: PalaceDetailRoute,
})

function RoomContentRoute() {
  const { roomId } = roomContentRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return (
    <RoomContentPage
      roomId={roomId}
      onBack={back}
      onMatch={() => navigate({ to: ROUTES.roomMatch, params: { roomId } })}
      onVerse={() => navigate({ to: ROUTES.roomVerse, params: { roomId } })}
    />
  )
}

const roomContentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomContent,
  component: RoomContentRoute,
})

function RoomTrainRoute() {
  const { roomId } = roomTrainRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomContent, params: { roomId } }))
  return <RoomTrainPage roomId={roomId} onBack={back} />
}

const roomTrainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomTrain,
  component: RoomTrainRoute,
})

function RoomMatchRoute() {
  const { roomId } = roomMatchRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomContent, params: { roomId } }))
  return <MatchPage roomId={roomId} onBack={back} />
}

const roomMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomMatch,
  component: RoomMatchRoute,
})

function RoomVerseRoute() {
  const { roomId } = roomVerseRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomContent, params: { roomId } }))
  return <VerseStudyPage roomId={roomId} onBack={back} />
}

const roomVerseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomVerse,
  component: RoomVerseRoute,
})

function ReviewRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return <ReviewPage onBack={back} />
}

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.review,
  component: ReviewRoute,
})

function QuizRoute() {
  const { palaceId } = quizRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.palaceDetail, params: { palaceId } }))
  return <QuizPage palaceId={palaceId} onBack={back} />
}

const quizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceQuiz,
  component: QuizRoute,
})

function ProfileRoute() {
  const navigate = useNavigate()
  return (
    <ProfilePage
      onOpenSettings={() => navigate({ to: ROUTES.settings })}
      onOpenNotifications={() => navigate({ to: ROUTES.notifications })}
      onEditProfile={() => navigate({ to: ROUTES.settingsProfile })}
      onOpenStreak={() => navigate({ to: ROUTES.streak })}
      onOpenBadges={() => navigate({ to: ROUTES.badges })}
      onOpenBadge={(badgeId) => navigate({ to: ROUTES.badgeDetail, params: { badgeId } })}
      onOpenAchievements={() => navigate({ to: ROUTES.achievements })}
    />
  )
}

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.profile,
  component: ProfileRoute,
})

function StreakRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.profile }))
  return <StreakPage onBack={back} />
}

const streakRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.streak,
  component: StreakRoute,
})

function BadgesRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.profile }))
  return (
    <BadgesPage
      onBack={back}
      onOpenBadge={(badgeId) => navigate({ to: ROUTES.badgeDetail, params: { badgeId } })}
    />
  )
}

const badgesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.badges,
  component: BadgesRoute,
})

function BadgeDetailRoute() {
  const { badgeId } = badgeDetailRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.badges }))
  return <BadgeDetailPage badgeId={badgeId} onBack={back} />
}

const badgeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.badgeDetail,
  component: BadgeDetailRoute,
})

function AchievementsRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.profile }))
  return (
    <AchievementsPage
      onBack={back}
      onOpenAchievement={(achievementId) =>
        navigate({ to: ROUTES.achievementDetail, params: { achievementId } })
      }
    />
  )
}

const achievementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.achievements,
  component: AchievementsRoute,
})

function AchievementDetailRoute() {
  const { achievementId } = achievementDetailRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.achievements }))
  return <AchievementDetailPage achievementId={achievementId} onBack={back} />
}

const achievementDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.achievementDetail,
  component: AchievementDetailRoute,
})

function SettingsRoute() {
  const navigate = useNavigate()
  const transfer = useProgressTransfer()
  const { signOut } = useAuthActions()
  const sessionKind = useSessionStore((state) => state.session?.kind ?? 'guest')
  const back = useBack(() => navigate({ to: ROUTES.profile }))
  const logout = async () => {
    await signOut()
    await navigate({ to: ROUTES.login })
  }
  return (
    <SettingsPage
      onBack={back}
      onEditProfile={() => navigate({ to: ROUTES.settingsProfile })}
      onPrivacy={() => navigate({ to: ROUTES.settingsPrivacy })}
      onHelp={() => navigate({ to: ROUTES.settingsHelp })}
      onAbout={() => navigate({ to: ROUTES.settingsAbout })}
      onExport={transfer.exportNow}
      onImportFile={transfer.importFile}
      onSignIn={() => navigate({ to: ROUTES.login })}
      onLogout={logout}
      sessionKind={sessionKind}
    />
  )
}

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings,
  component: SettingsRoute,
})

function SettingsProfileRoute() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  const exitToLogin = async () => {
    await signOut()
    await navigate({ to: ROUTES.login })
  }
  return (
    <SettingsProfilePage
      onBack={back}
      onChangePassword={() => navigate({ to: ROUTES.settingsChangePassword })}
      onDeleteAccount={exitToLogin}
    />
  )
}

function SettingsChangePasswordRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  return <SettingsChangePasswordPage onBack={back} />
}

const settingsChangePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsChangePassword,
  component: SettingsChangePasswordRoute,
})

const settingsProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsProfile,
  component: SettingsProfileRoute,
})

function SettingsPrivacyRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  return <SettingsPrivacyPage onBack={back} />
}

const settingsPrivacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsPrivacy,
  component: SettingsPrivacyRoute,
})

function SettingsHelpRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  return <SettingsHelpPage onBack={back} />
}

const settingsHelpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsHelp,
  component: SettingsHelpRoute,
})

function SettingsAboutRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  return <SettingsAboutPage onBack={back} />
}

const settingsAboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsAbout,
  component: SettingsAboutRoute,
})

function NotificationsRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return <NotificationsPage onBack={back} />
}

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.notifications,
  component: NotificationsRoute,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  forgotRoute,
  welcomeRoute,
  homeRoute,
  palacesRoute,
  palaceDetailRoute,
  roomContentRoute,
  roomTrainRoute,
  roomMatchRoute,
  roomVerseRoute,
  reviewRoute,
  quizRoute,
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
  settingsHelpRoute,
  settingsAboutRoute,
  notificationsRoute,
])

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
