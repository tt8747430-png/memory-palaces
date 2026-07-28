import { useTranslation } from 'react-i18next'
import type { AchievementId, BadgeId } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectEffectiveProfile, useProfileStore } from '@/entities/profile'
import { selectUnreadCount, useNotificationStore } from '@/entities/notification'
import { ProfileBar, ProfileHero } from '@/widgets/profile-header'
import {
  AchievementsSection,
  BadgesSection,
  NextMilestoneCard,
  useRewards,
} from '@/widgets/rewards'
import { AppScreen, Skeleton } from '@/shared/ui'

export interface ProfilePageProps {
  onOpenSettings?: () => void
  onOpenNotifications?: () => void
  onEditProfile?: () => void
  onOpenStreak?: () => void
  onOpenBadges?: () => void
  onOpenBadge?: (id: BadgeId) => void
  onOpenAchievements?: () => void
  onOpenAchievement?: (id: AchievementId) => void
}

function joinedYearOf(createdAt: string): number | null {
  const year = new Date(createdAt).getUTCFullYear()
  return Number.isFinite(year) ? year : null
}

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
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const profile = useProfileStore(selectEffectiveProfile)
  const unreadCount = useNotificationStore(selectUnreadCount)
  const { ready, achievements, badges, milestone, topLevelDecks, xp, streakCount } = useRewards()

  const name = profile.name.trim() || session?.displayName || t('profile.guest')

  return (
    <AppScreen
      className="pb-nav"
      header={
        <ProfileBar
          name={name}
          unreadCount={unreadCount}
          onOpenNotifications={() => onOpenNotifications?.()}
          onOpenSettings={() => onOpenSettings?.()}
        />
      }
    >
      {!ready ? (
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

function ProfileSkeleton() {
  return (
    <div aria-hidden className="flex flex-col items-center pt-5">
      <Skeleton className="size-[104px]" />
      <Skeleton className="mt-4 h-3 w-32" />
      <Skeleton className="mt-5 h-12 w-full max-w-[300px] rounded-card" />
      <div className="mt-8 w-full space-y-8">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-24 rounded-card" tone="quiet" />
        <Skeleton className="h-24 rounded-card" tone="quiet" />
      </div>
    </div>
  )
}
