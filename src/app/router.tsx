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
import { PalacesPage } from '@/pages/palaces'
import { PalaceDetailPage } from '@/pages/palace-detail'
import { PalaceSettingsPage } from '@/pages/palace-settings'
import { RoomHubPage } from '@/pages/room-hub'
import { CardEditorPage } from '@/pages/card-editor'
import { QuestionEditorPage } from '@/pages/question-editor'
import { StudyCardsPage } from '@/pages/study'
import { MatchPage } from '@/pages/match'
import { VerseStudyPage } from '@/pages/verse'
import { RoomQuizPage } from '@/pages/room-quiz'
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
import { SettingsSwipePage } from '@/pages/settings-swipe'
import { SettingsClearPage } from '@/pages/settings-clear'
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

// The palaces library is the home: `/` renders it directly. Due-card counts surface
// per-palace in the grid rather than as a separate hero. The thin wrapper keeps the page
// router-free and testable.
function HomeRoute() {
  const navigate = useNavigate()
  const { create, folder } = homeRoute.useSearch()
  return (
    <PalacesPage
      openCreate={create}
      folderId={folder ?? null}
      onOpenFolder={(id) => navigate({ to: ROUTES.home, search: { folder: id } })}
      onCloseFolder={() => navigate({ to: ROUTES.home, search: {} })}
      onOpenPalace={(palaceId) => navigate({ to: ROUTES.palaceDetail, params: { palaceId } })}
      onOpenPalaceSettings={(palaceId) =>
        navigate({ to: ROUTES.palaceSettings, params: { palaceId } })
      }
      onOpenProfile={() => navigate({ to: ROUTES.profile })}
      onOpenNotifications={() => navigate({ to: ROUTES.notifications })}
      onOpenStreak={() => navigate({ to: ROUTES.streak })}
    />
  )
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  // `?create` opens the create sheet on arrival; `?folder=<id>` drills into a folder (or the
  // archived view) so the Back button and deep links walk the library tree.
  validateSearch: (search: Record<string, unknown>): { create?: boolean; folder?: string } => ({
    create: search.create === true || search.create === 'true' ? true : undefined,
    folder: typeof search.folder === 'string' && search.folder ? search.folder : undefined,
  }),
  component: HomeRoute,
})

// `/palaces` folds into the home; keep the path alive for old links by redirecting it there.
const palacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaces,
  beforeLoad: () => {
    throw redirect({ to: ROUTES.home })
  },
})

function PalaceDetailRoute() {
  const { palaceId } = palaceDetailRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return (
    <PalaceDetailPage
      palaceId={palaceId}
      onBack={back}
      onOpenRoom={(roomId) => navigate({ to: ROUTES.roomHub, params: { roomId } })}
      onOpenSettings={() => navigate({ to: ROUTES.palaceSettings, params: { palaceId } })}
      onStudyPalace={() => navigate({ to: ROUTES.palaceStudy, params: { palaceId } })}
      onMatch={() => navigate({ to: ROUTES.palaceMatch, params: { palaceId } })}
      onTest={() => navigate({ to: ROUTES.palaceQuiz, params: { palaceId } })}
      onVerse={() => navigate({ to: ROUTES.palaceVerse, params: { palaceId } })}
    />
  )
}

const palaceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceDetail,
  component: PalaceDetailRoute,
})

function PalaceSettingsRoute() {
  const { palaceId } = palaceSettingsRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.palaceDetail, params: { palaceId } }))
  return (
    <PalaceSettingsPage
      palaceId={palaceId}
      onBack={back}
      onExit={() => navigate({ to: ROUTES.home })}
    />
  )
}

const palaceSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceSettings,
  component: PalaceSettingsRoute,
})

function RoomHubRoute() {
  const { roomId } = roomHubRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return (
    <RoomHubPage
      roomId={roomId}
      onBack={back}
      onStudy={() => navigate({ to: ROUTES.roomStudy, params: { roomId } })}
      onMatch={() => navigate({ to: ROUTES.roomMatch, params: { roomId } })}
      onTest={() => navigate({ to: ROUTES.roomQuiz, params: { roomId } })}
      onVerse={() => navigate({ to: ROUTES.roomVerse, params: { roomId } })}
      onAddCard={() => navigate({ to: ROUTES.roomCardNew, params: { roomId } })}
      onEditCard={(cardId) => navigate({ to: ROUTES.roomCardEdit, params: { roomId, cardId } })}
      onAddQuestion={() => navigate({ to: ROUTES.roomQuestionNew, params: { roomId } })}
      onEditQuestion={(questionId) =>
        navigate({ to: ROUTES.roomQuestionEdit, params: { roomId, questionId } })
      }
      onDeleted={back}
    />
  )
}

const roomHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomHub,
  component: RoomHubRoute,
})

function RoomCardNewRoute() {
  const { roomId } = roomCardNewRoute.useParams()
  const navigate = useNavigate()
  const toRoom = () => navigate({ to: ROUTES.roomHub, params: { roomId } })
  const back = useBack(toRoom)
  // `replace` on done so the just-left editor isn't a back-route from the room.
  return (
    <CardEditorPage
      roomId={roomId}
      onBack={back}
      onDone={() => navigate({ to: ROUTES.roomHub, params: { roomId }, replace: true })}
    />
  )
}

const roomCardNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomCardNew,
  component: RoomCardNewRoute,
})

function RoomCardEditRoute() {
  const { roomId, cardId } = roomCardEditRoute.useParams()
  const navigate = useNavigate()
  const toRoom = () => navigate({ to: ROUTES.roomHub, params: { roomId } })
  const back = useBack(toRoom)
  // `replace` everywhere so neither finishing nor walking prev/next stacks editor entries in
  // the back history — Back from the room always lands on the room.
  return (
    <CardEditorPage
      roomId={roomId}
      cardId={cardId}
      onBack={back}
      onDone={() => navigate({ to: ROUTES.roomHub, params: { roomId }, replace: true })}
      onNavigateCard={(id) =>
        navigate({ to: ROUTES.roomCardEdit, params: { roomId, cardId: id }, replace: true })
      }
    />
  )
}

const roomCardEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomCardEdit,
  component: RoomCardEditRoute,
})

function RoomQuestionNewRoute() {
  const { roomId } = roomQuestionNewRoute.useParams()
  const navigate = useNavigate()
  const toRoom = () => navigate({ to: ROUTES.roomHub, params: { roomId } })
  const back = useBack(toRoom)
  return <QuestionEditorPage roomId={roomId} onBack={back} onDone={toRoom} />
}

const roomQuestionNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomQuestionNew,
  component: RoomQuestionNewRoute,
})

function RoomQuestionEditRoute() {
  const { roomId, questionId } = roomQuestionEditRoute.useParams()
  const navigate = useNavigate()
  const toRoom = () => navigate({ to: ROUTES.roomHub, params: { roomId } })
  const back = useBack(toRoom)
  return (
    <QuestionEditorPage roomId={roomId} questionId={questionId} onBack={back} onDone={toRoom} />
  )
}

const roomQuestionEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomQuestionEdit,
  component: RoomQuestionEditRoute,
})

function RoomStudyRoute() {
  const { roomId } = roomStudyRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomHub, params: { roomId } }))
  return <StudyCardsPage scope={{ kind: 'room', roomId }} onBack={back} />
}

const roomStudyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomStudy,
  component: RoomStudyRoute,
})

function PalaceStudyRoute() {
  const { palaceId } = palaceStudyRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.palaceDetail, params: { palaceId } }))
  return <StudyCardsPage scope={{ kind: 'palace', palaceId }} onBack={back} />
}

const palaceStudyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceStudy,
  component: PalaceStudyRoute,
})

function RoomMatchRoute() {
  const { roomId } = roomMatchRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomHub, params: { roomId } }))
  return <MatchPage scope={{ kind: 'room', roomId }} onBack={back} />
}

const roomMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomMatch,
  component: RoomMatchRoute,
})

function PalaceMatchRoute() {
  const { palaceId } = palaceMatchRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.palaceDetail, params: { palaceId } }))
  return <MatchPage scope={{ kind: 'palace', palaceId }} onBack={back} />
}

const palaceMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceMatch,
  component: PalaceMatchRoute,
})

function RoomVerseRoute() {
  const { roomId } = roomVerseRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomHub, params: { roomId } }))
  return <VerseStudyPage scope={{ kind: 'room', roomId }} onBack={back} />
}

const roomVerseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomVerse,
  component: RoomVerseRoute,
})

function PalaceVerseRoute() {
  const { palaceId } = palaceVerseRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.palaceDetail, params: { palaceId } }))
  return <VerseStudyPage scope={{ kind: 'palace', palaceId }} onBack={back} />
}

const palaceVerseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.palaceVerse,
  component: PalaceVerseRoute,
})

function RoomQuizRoute() {
  const { roomId } = roomQuizRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.roomHub, params: { roomId } }))
  return <RoomQuizPage roomId={roomId} onBack={back} />
}

const roomQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.roomQuiz,
  component: RoomQuizRoute,
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
      onOpenAchievement={(achievementId) =>
        navigate({ to: ROUTES.achievementDetail, params: { achievementId } })
      }
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
      onSwipe={() => navigate({ to: ROUTES.settingsSwipe })}
      onClearData={() => navigate({ to: ROUTES.settingsClear })}
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

function SettingsSwipeRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  return <SettingsSwipePage onBack={back} />
}

const settingsSwipeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsSwipe,
  component: SettingsSwipeRoute,
})

function SettingsClearRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.settings }))
  return <SettingsClearPage onBack={back} />
}

const settingsClearRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settingsClear,
  component: SettingsClearRoute,
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
  palaceSettingsRoute,
  roomHubRoute,
  roomCardNewRoute,
  roomCardEditRoute,
  roomQuestionNewRoute,
  roomQuestionEditRoute,
  roomStudyRoute,
  palaceStudyRoute,
  roomMatchRoute,
  palaceMatchRoute,
  roomVerseRoute,
  palaceVerseRoute,
  roomQuizRoute,
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
  settingsSwipeRoute,
  settingsClearRoute,
  settingsHelpRoute,
  settingsAboutRoute,
  notificationsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Off by design: every screen is its own inner scroller that `AppScreen` resets to the top
  // on mount. With restoration on, one screen's cached offset bled into the next (identical
  // `<main>`) scroller, so detail/sub-pages opened pre-scrolled.
  scrollRestoration: false,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
