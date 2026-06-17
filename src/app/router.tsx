import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
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
import { StatsPage } from '@/pages/stats'
import { SettingsPage, useProgressTransfer } from '@/pages/settings'
import { SettingsProfilePage } from '@/pages/settings-profile'
import { SettingsChangePasswordPage } from '@/pages/settings-change-password'
import { SettingsPhonePage } from '@/pages/settings-phone'
import { SettingsPrivacyPage } from '@/pages/settings-privacy'
import { SettingsClearDataPage } from '@/pages/settings-clear-data'
import { SettingsHelpPage } from '@/pages/settings-help'
import { SettingsAboutPage } from '@/pages/settings-about'
import { NotificationsPage } from '@/pages/notifications'
import { useSessionStore } from '@/entities/session'
import { useAuthActions } from '@/features/session'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import { services } from './composition-root'

const rootRoute = createRootRoute({
  component: RootLayout,
  // Session gate: the gateway (localStorage) is the source of truth, read
  // synchronously so the redirect resolves before any screen paints.
  beforeLoad: ({ location }) => {
    const target = authRedirect(location.pathname, services.authGateway.getPersisted()?.kind ?? null)
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
  return <ForgotPasswordPage onBack={() => navigate({ to: ROUTES.login })} />
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
      onOpenSettings={() => navigate({ to: ROUTES.settings })}
      onTrainRoom={(roomId) => navigate({ to: ROUTES.roomTrain, params: { roomId } })}
      onOpenPalace={(palaceId) => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
      onViewAllPalaces={() => navigate({ to: ROUTES.palaces })}
      onCreatePalace={() => navigate({ to: ROUTES.palaces })}
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
  return (
    <PalacesPage
      onOpenPalace={(palaceId) => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
    />
  )
}

const palacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaces,
  component: PalacesRoute,
})

function PalaceDetailRoute() {
  const { palaceId } = palaceDetailRoute.useParams()
  const navigate = useNavigate()
  return (
    <PalaceDetailPage
      palaceId={palaceId}
      onBack={() => navigate({ to: ROUTES.palaces })}
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
  return (
    <RoomContentPage
      roomId={roomId}
      onBack={() => navigate({ to: ROUTES.home })}
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
  return (
    <RoomTrainPage
      roomId={roomId}
      onBack={() => navigate({ to: ROUTES.roomContent, params: { roomId } })}
    />
  )
}

const roomTrainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomTrain,
  component: RoomTrainRoute,
})

function RoomMatchRoute() {
  const { roomId } = roomMatchRoute.useParams()
  const navigate = useNavigate()
  return (
    <MatchPage
      roomId={roomId}
      onBack={() => navigate({ to: ROUTES.roomContent, params: { roomId } })}
    />
  )
}

const roomMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomMatch,
  component: RoomMatchRoute,
})

function RoomVerseRoute() {
  const { roomId } = roomVerseRoute.useParams()
  const navigate = useNavigate()
  return (
    <VerseStudyPage
      roomId={roomId}
      onBack={() => navigate({ to: ROUTES.roomContent, params: { roomId } })}
    />
  )
}

const roomVerseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomVerse,
  component: RoomVerseRoute,
})

function ReviewRoute() {
  const navigate = useNavigate()
  return <ReviewPage onBack={() => navigate({ to: ROUTES.home })} />
}

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.review,
  component: ReviewRoute,
})

function QuizRoute() {
  const { palaceId } = quizRoute.useParams()
  const navigate = useNavigate()
  return (
    <QuizPage
      palaceId={palaceId}
      onBack={() => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
    />
  )
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
      onOpenStats={() => navigate({ to: ROUTES.stats })}
    />
  )
}

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.profile,
  component: ProfileRoute,
})

function StatsRoute() {
  const navigate = useNavigate()
  return <StatsPage onBack={() => navigate({ to: ROUTES.profile })} />
}

const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.stats,
  component: StatsRoute,
})

function SettingsRoute() {
  const navigate = useNavigate()
  const transfer = useProgressTransfer()
  const { signOut } = useAuthActions()
  const sessionKind = useSessionStore((state) => state.session?.kind ?? 'guest')
  return (
    <SettingsPage
      onBack={() => navigate({ to: ROUTES.profile })}
      onEditProfile={() => navigate({ to: ROUTES.settingsProfile })}
      onPrivacy={() => navigate({ to: ROUTES.settingsPrivacy })}
      onClearData={() => navigate({ to: ROUTES.settingsClearData })}
      onHelp={() => navigate({ to: ROUTES.settingsHelp })}
      onAbout={() => navigate({ to: ROUTES.settingsAbout })}
      onExport={transfer.exportNow}
      onImportFile={transfer.importFile}
      onChangePassword={() => navigate({ to: ROUTES.settingsChangePassword })}
      onPhone={() => navigate({ to: ROUTES.settingsPhone })}
      onSignIn={() => navigate({ to: ROUTES.login })}
      onLogout={async () => {
        await signOut()
        await navigate({ to: ROUTES.login })
      }}
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
  const exitToLogin = async () => {
    await signOut()
    await navigate({ to: ROUTES.login })
  }
  return (
    <SettingsProfilePage
      onBack={() => navigate({ to: ROUTES.settings })}
      onChangePassword={() => navigate({ to: ROUTES.settingsChangePassword })}
      onLogout={exitToLogin}
      onDeleteAccount={exitToLogin}
    />
  )
}

function SettingsChangePasswordRoute() {
  const navigate = useNavigate()
  return <SettingsChangePasswordPage onBack={() => navigate({ to: ROUTES.settings })} />
}

const settingsChangePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsChangePassword,
  component: SettingsChangePasswordRoute,
})

function SettingsPhoneRoute() {
  const navigate = useNavigate()
  return <SettingsPhonePage onBack={() => navigate({ to: ROUTES.settings })} />
}

const settingsPhoneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsPhone,
  component: SettingsPhoneRoute,
})

const settingsProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsProfile,
  component: SettingsProfileRoute,
})

function SettingsPrivacyRoute() {
  const navigate = useNavigate()
  return <SettingsPrivacyPage onBack={() => navigate({ to: ROUTES.settings })} />
}

const settingsPrivacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsPrivacy,
  component: SettingsPrivacyRoute,
})

function SettingsClearDataRoute() {
  const navigate = useNavigate()
  return <SettingsClearDataPage onBack={() => navigate({ to: ROUTES.settings })} />
}

const settingsClearDataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsClearData,
  component: SettingsClearDataRoute,
})

function SettingsHelpRoute() {
  const navigate = useNavigate()
  return <SettingsHelpPage onBack={() => navigate({ to: ROUTES.settings })} />
}

const settingsHelpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsHelp,
  component: SettingsHelpRoute,
})

function SettingsAboutRoute() {
  const navigate = useNavigate()
  return <SettingsAboutPage onBack={() => navigate({ to: ROUTES.settings })} />
}

const settingsAboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsAbout,
  component: SettingsAboutRoute,
})

function NotificationsRoute() {
  const navigate = useNavigate()
  return <NotificationsPage onBack={() => navigate({ to: ROUTES.home })} />
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
  statsRoute,
  settingsRoute,
  settingsProfileRoute,
  settingsChangePasswordRoute,
  settingsPhoneRoute,
  settingsPrivacyRoute,
  settingsClearDataRoute,
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
