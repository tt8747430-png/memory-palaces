import { useEffect } from 'react'
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
import { DeckLibraryPage } from '@/pages/deck-library'
import { ArchivedDecksPage } from '@/pages/archived-decks'
import { DeckDetailPage } from '@/pages/deck-detail'
import { DeckSettingsPage } from '@/pages/deck-settings'
import { DeckQuestionsPage } from '@/pages/deck-questions'
import { QuestionEditorPage } from '@/pages/question-editor'
import { CardEditorPage } from '@/pages/card-editor'
import { PasteNotesPage } from '@/pages/paste-notes'
import { ImportReviewPage } from '@/pages/import-review'
import { MatchPage } from '@/pages/match'
import { QuizPage } from '@/pages/quiz'
import { StudyCardsPage } from '@/pages/study'
import { ProfilePage } from '@/pages/profile'
import { StreakPage } from '@/pages/streak'
import { BadgesPage } from '@/pages/badges'
import { BadgeDetailPage } from '@/pages/badge-detail'
import { AchievementsPage } from '@/pages/achievements'
import { AchievementDetailPage } from '@/pages/achievement-detail'
import { SettingsPage } from '@/pages/settings'
import { SettingsProfilePage } from '@/pages/settings-profile'
import { SettingsChangePasswordPage } from '@/pages/settings-change-password'
import { SettingsPrivacyPage } from '@/pages/settings-privacy'
import { SettingsSwipePage } from '@/pages/settings-swipe'
import { SettingsHelpPage } from '@/pages/settings-help'
import { SettingsAboutPage } from '@/pages/settings-about'
import { NotificationsPage } from '@/pages/notifications'
import { useSessionStore } from '@/entities/session'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { useAuthActions } from '@/features/session'
import { createDeck } from '@/features/deck'
import { nextDefaultName } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'
import { authRedirect } from './auth-guard'
import { services } from './composition-root'

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
    <DeckLibraryPage
      onOpenDeck={(deckId) => navigate({ to: ROUTES.deckDetail, params: { deckId } })}
      onOpenDeckSettings={(deckId) => navigate({ to: ROUTES.deckSettings, params: { deckId } })}
      onImportPaste={() => navigate({ to: ROUTES.newPaste })}
      onReviewDeck={(deckId) => navigate({ to: ROUTES.deckImport, params: { deckId } })}
      onOpenProfile={() => navigate({ to: ROUTES.profile })}
      onOpenNotifications={() => navigate({ to: ROUTES.notifications })}
      onOpenStreak={() => navigate({ to: ROUTES.streak })}
      onOpenArchived={() => navigate({ to: ROUTES.archived })}
    />
  )
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  component: HomeRoute,
})

function DeckDetailRoute() {
  const { deckId } = deckDetailRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return (
    <DeckDetailPage
      deckId={deckId}
      onBack={back}
      onOpenSettings={() => navigate({ to: ROUTES.deckSettings, params: { deckId } })}
      onStudy={() => navigate({ to: ROUTES.deckStudy, params: { deckId } })}
      onMatch={() => navigate({ to: ROUTES.deckMatch, params: { deckId } })}
      onTest={() => navigate({ to: ROUTES.deckQuestions, params: { deckId } })}
      onAddCard={() => navigate({ to: ROUTES.deckCardNew, params: { deckId } })}
      onEditCard={(cardId) => navigate({ to: ROUTES.deckCardEdit, params: { deckId, cardId } })}
      onPasteNotes={() => navigate({ to: ROUTES.deckPaste, params: { deckId } })}
      onReviewImport={() => navigate({ to: ROUTES.deckImport, params: { deckId } })}
    />
  )
}

const deckDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckDetail,
  component: DeckDetailRoute,
})

function DeckMatchRoute() {
  const { deckId } = deckMatchRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return <MatchPage scope={{ kind: 'deck', deckId }} onBack={back} />
}

const deckMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckMatch,
  component: DeckMatchRoute,
})

function DeckQuizRoute() {
  const { deckId } = deckQuizRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return <QuizPage deckId={deckId} onBack={back} />
}

const deckQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuiz,
  component: DeckQuizRoute,
})

function DeckQuestionsRoute() {
  const { deckId } = deckQuestionsRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return (
    <DeckQuestionsPage
      deckId={deckId}
      onBack={back}
      onAddQuestion={() => navigate({ to: ROUTES.deckQuestionNew, params: { deckId } })}
      onEditQuestion={(questionId) =>
        navigate({ to: ROUTES.deckQuestionEdit, params: { deckId, questionId } })
      }
      onStartTest={() => navigate({ to: ROUTES.deckQuiz, params: { deckId } })}
    />
  )
}

const deckQuestionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuestions,
  component: DeckQuestionsRoute,
})

function DeckQuestionNewRoute() {
  const { deckId } = deckQuestionNewRoute.useParams()
  const navigate = useNavigate()
  const toQuestions = () => navigate({ to: ROUTES.deckQuestions, params: { deckId } })
  const back = useBack(toQuestions)
  return <QuestionEditorPage deckId={deckId} onBack={back} onDone={toQuestions} />
}

const deckQuestionNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuestionNew,
  component: DeckQuestionNewRoute,
})

function DeckQuestionEditRoute() {
  const { deckId, questionId } = deckQuestionEditRoute.useParams()
  const navigate = useNavigate()
  const toQuestions = () => navigate({ to: ROUTES.deckQuestions, params: { deckId } })
  const back = useBack(toQuestions)
  return (
    <QuestionEditorPage
      deckId={deckId}
      questionId={questionId}
      onBack={back}
      onDone={toQuestions}
    />
  )
}

const deckQuestionEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckQuestionEdit,
  component: DeckQuestionEditRoute,
})

function DeckPasteRoute() {
  const { deckId } = deckPasteRoute.useParams()
  const navigate = useNavigate()
  const toDeck = () => navigate({ to: ROUTES.deckDetail, params: { deckId } })
  const back = useBack(toDeck)
  return (
    <PasteNotesPage
      onBack={back}
      onReview={() => navigate({ to: ROUTES.deckImport, params: { deckId }, replace: true })}
    />
  )
}

const deckPasteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckPaste,
  component: DeckPasteRoute,
})

function NewPasteRoute() {
  const navigate = useNavigate()
  const deckStore = useDeckStoreApi()
  useEffect(() => {
    deckStore.getState().start()
  }, [deckStore])
  const decks = useDeckStore(selectDecks)
  const back = useBack(() => navigate({ to: ROUTES.home }))
  const defaultName = nextDefaultName(
    'New Deck',
    decks.filter((d) => d.parentId === null && d.folderId === null).map((d) => d.name),
  )
  return (
    <PasteNotesPage
      newDeck
      defaultDeckName={defaultName}
      onBack={back}
      onReview={(name) =>
        void createDeck(deckStore, { name: name ?? defaultName }).then((deck) =>
          navigate({ to: ROUTES.deckImport, params: { deckId: deck.id }, replace: true }),
        )
      }
    />
  )
}

const newPasteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.newPaste,
  component: NewPasteRoute,
})

function DeckImportRoute() {
  const { deckId } = deckImportRoute.useParams()
  const navigate = useNavigate()
  const toDeck = () => navigate({ to: ROUTES.deckDetail, params: { deckId }, replace: true })
  const back = useBack(toDeck)
  return <ImportReviewPage deckId={deckId} onBack={back} onDone={toDeck} />
}

const deckImportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckImport,
  component: DeckImportRoute,
})

function DeckSettingsRoute() {
  const { deckId } = deckSettingsRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return (
    <DeckSettingsPage
      deckId={deckId}
      onBack={back}
      onDeleted={() => navigate({ to: ROUTES.home })}
    />
  )
}

const deckSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckSettings,
  component: DeckSettingsRoute,
})

function DeckStudyRoute() {
  const { deckId } = deckStudyRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return <StudyCardsPage scope={{ kind: 'deck', deckId }} onBack={back} />
}

const deckStudyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckStudy,
  component: DeckStudyRoute,
})

function DeckCardNewRoute() {
  const { deckId } = deckCardNewRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return <CardEditorPage deckId={deckId} onBack={back} />
}

const deckCardNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckCardNew,
  component: DeckCardNewRoute,
})

function DeckCardEditRoute() {
  const { deckId, cardId } = deckCardEditRoute.useParams()
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.deckDetail, params: { deckId } }))
  return (
    <CardEditorPage
      deckId={deckId}
      cardId={cardId}
      onBack={back}
      onNavigateCard={(id) =>
        navigate({ to: ROUTES.deckCardEdit, params: { deckId, cardId: id }, replace: true })
      }
    />
  )
}

const deckCardEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.deckCardEdit,
  component: DeckCardEditRoute,
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
      onHelp={() => navigate({ to: ROUTES.settingsHelp })}
      onAbout={() => navigate({ to: ROUTES.settingsAbout })}
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

function ArchivedDecksRoute() {
  const navigate = useNavigate()
  const back = useBack(() => navigate({ to: ROUTES.home }))
  return <ArchivedDecksPage onBack={back} />
}

const archivedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.archived,
  component: ArchivedDecksRoute,
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
  settingsHelpRoute,
  settingsAboutRoute,
  notificationsRoute,
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
