import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type AchievementId,
  type BadgeId,
  cardsInSubtree,
  computeAchievements,
  computeBadges,
  computeTrainingTotals,
  isDeckCompleted,
  nextMilestone,
  totalTrainingDays,
  useStickyHeader,
} from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import {
  selectIsReady as selectProgressReady,
  selectProgress,
  useProgressStore,
  useProgressStoreApi,
} from '@/entities/progress'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  selectCards,
  selectIsReady as selectCardsReady,
  useCardStore,
  useCardStoreApi,
} from '@/entities/card'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { ProfileBar, ProfileHero } from '@/widgets/profile-header'
import { BadgesSection, NextMilestoneCard } from '@/widgets/badge-list'
import { AchievementsSection } from '@/widgets/achievement-list'
import { AppScreen } from '@/shared/ui'

export interface ProfilePageProps {
  /** Open the settings screen; wired by the route wrapper. */
  onOpenSettings?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Edit the profile photo (avatar tap); wired by the route wrapper. */
  onEditProfile?: () => void
  /** Open the Streak screen (from the avatar-edit and the Streak overview stat). */
  onOpenStreak?: () => void
  /** Open the full Badges page; wired by the route wrapper. */
  onOpenBadges?: () => void
  /** Open a single badge's detail (milestone nudge + preview medallions). */
  onOpenBadge?: (id: BadgeId) => void
  /** Open the full Achievements page; wired by the route wrapper. */
  onOpenAchievements?: () => void
  /** Open a single milestone's detail (preview medallions). */
  onOpenAchievement?: (id: AchievementId) => void
}

function joinedYearOf(createdAt: string): number | null {
  const year = new Date(createdAt).getUTCFullYear()
  return Number.isFinite(year) ? year : null
}

/** Profile tab. A guest identity today (account claim is Phase 9). One persistent bar
 * (name + notifications + settings) over a centered hero — circular avatar, @handle ·
 * joined, and a streak/XP/decks headline. Below: the closest-milestone nudge, then the
 * Badges and Achievements preview rows. Everything derives live from the
 * progress/deck/card stores — a glance, never stored or faked. */
export function ProfilePage({
  onOpenSettings,
  onOpenNotifications,
  onEditProfile,
  onOpenStreak,
  onOpenBadges,
  onOpenBadge,
  onOpenAchievements,
  onOpenAchievement,
}: ProfilePageProps = {}) {
  const header = useStickyHeader()
  const session = useSessionStore((state) => state.session)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const progressStore = useProgressStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const notificationStore = useNotificationStoreApi()
  const progress = useProgressStore(selectProgress)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const unreadCount = useNotificationStore(selectUnreadCount)
  // Gate the progress-derived hero/badges/achievements on hydration so a returning user
  // never sees a flash of zeros and locked medallions before RxDB resolves.
  const progressReady = useProgressStore(selectProgressReady)
  const decksReady = useDeckStore(selectDecksReady)
  const cardsReady = useCardStore(selectCardsReady)
  const dataReady = progressReady && decksReady && cardsReady

  useEffect(() => {
    profileStore.getState().start()
    progressStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
    notificationStore.getState().start()
  }, [profileStore, progressStore, deckStore, cardStore, notificationStore])

  const { t } = useTranslation()
  const name = profile.name.trim() || session?.displayName || t('profile.guest')
  const xp = progress?.xp ?? 0
  const streakCount = progress?.streakCount ?? 0
  const longestStreak = progress?.longestStreak ?? 0
  const bestQuizAccuracy = progress?.bestQuizAccuracy ?? 0
  const trainingDays = useMemo(() => progress?.trainingDays ?? [], [progress])

  const totals = useMemo(() => computeTrainingTotals(decks, cards), [decks, cards])
  const daysTrained = useMemo(() => totalTrainingDays(trainingDays), [trainingDays])
  const topLevelDecks = useMemo(() => decks.filter((deck) => deck.parentId === null), [decks])
  const anyDeckCompleted = useMemo(
    () => topLevelDecks.some((deck) => isDeckCompleted(cardsInSubtree(decks, cards, deck.id))),
    [topLevelDecks, decks, cards],
  )

  const badges = useMemo(
    () =>
      computeBadges({
        xp,
        longestStreak,
        decksCompleted: totals.decksCompleted,
        deckCount: topLevelDecks.length,
        totalCards: totals.totalCards,
        trainingDayCount: daysTrained,
      }),
    [xp, longestStreak, totals, topLevelDecks.length, daysTrained],
  )
  const milestone = useMemo(() => nextMilestone(badges), [badges])
  const achievements = useMemo(
    () =>
      computeAchievements({
        deckCount: topLevelDecks.length,
        streakCount,
        xp,
        bestQuizAccuracy,
        decksCompleted: totals.decksCompleted,
        anyDeckCompleted,
      }),
    [
      topLevelDecks.length,
      streakCount,
      xp,
      bestQuizAccuracy,
      totals.decksCompleted,
      anyDeckCompleted,
    ],
  )

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={header.ref}
      header={
        <ProfileBar
          header={header}
          name={name}
          unreadCount={unreadCount}
          onOpenNotifications={() => onOpenNotifications?.()}
          onOpenSettings={() => onOpenSettings?.()}
        />
      }
    >
      {!dataReady ? (
        <ProfileSkeleton />
      ) : (
        <>
          <ProfileHero
            name={name}
            username={profile.username}
            avatar={profile.avatar}
            xp={xp}
            streakCount={streakCount}
            palaceCount={topLevelDecks.length}
            joinedYear={session?.createdAt ? joinedYearOf(session.createdAt) : null}
            onEditProfile={() => onEditProfile?.()}
            onOpenStreak={() => onOpenStreak?.()}
          />

          {/* Fill at least a screen so a short profile still scrolls (gives the native
              pull-to-bounce something to overflow). Taller content scrolls normally. */}
          <div className="mt-8 flex min-h-[calc(100dvh-20rem)] flex-col gap-8">
            {milestone ? (
              <NextMilestoneCard badge={milestone} onOpen={() => onOpenBadge?.(milestone.id)} />
            ) : null}
            <BadgesSection
              badges={badges}
              onSeeAll={() => onOpenBadges?.()}
              onOpenBadge={(id) => onOpenBadge?.(id)}
            />
            <AchievementsSection
              achievements={achievements}
              onSeeAll={() => onOpenAchievements?.()}
              onOpenAchievement={(id) => onOpenAchievement?.(id)}
            />
          </div>
        </>
      )}
    </AppScreen>
  )
}

/** Calm placeholder shown until the progress stores hydrate, so the hero stats and the
 * badge/achievement rows never flash zeros or a wall of locks for a returning user. */
function ProfileSkeleton() {
  return (
    <div aria-hidden className="flex flex-col items-center pt-5">
      <div className="size-[104px] animate-pulse rounded-full bg-secondary/40" />
      <div className="mt-4 h-3 w-32 animate-pulse rounded-full bg-secondary/30" />
      <div className="mt-5 h-12 w-full max-w-[300px] animate-pulse rounded-card bg-secondary/30" />
      <div className="mt-8 w-full space-y-8">
        <div className="h-20 animate-pulse rounded-card bg-secondary/30" />
        <div className="h-24 animate-pulse rounded-card bg-secondary/20" />
        <div className="h-24 animate-pulse rounded-card bg-secondary/20" />
      </div>
    </div>
  )
}
