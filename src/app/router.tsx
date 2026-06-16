import { createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router'
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
import { SettingsPage } from '@/pages/settings'
import { NotificationsPage } from '@/pages/notifications'
import { ROUTES } from '@/shared/config/routes'
import { RootLayout } from './RootLayout'

const rootRoute = createRootRoute({ component: RootLayout })

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
  return <SettingsPage onBack={() => navigate({ to: ROUTES.profile })} />
}

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings,
  component: SettingsRoute,
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
