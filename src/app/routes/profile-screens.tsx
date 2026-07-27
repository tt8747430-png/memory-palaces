import { useNavigate } from '@tanstack/react-router'
import { AchievementDetailPage } from '@/pages/achievement-detail'
import { AchievementsPage } from '@/pages/achievements'
import { BadgeDetailPage } from '@/pages/badge-detail'
import { BadgesPage } from '@/pages/badges'
import { ProfilePage } from '@/pages/profile'
import { StreakPage } from '@/pages/streak'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from './use-back'

export function ProfileScreen() {
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

export function StreakScreen() {
  return <StreakPage onBack={useBackTo(ROUTES.profile)} />
}

export function BadgesScreen() {
  const navigate = useNavigate()
  return (
    <BadgesPage
      onBack={useBackTo(ROUTES.profile)}
      onOpenBadge={(badgeId) => navigate({ to: ROUTES.badgeDetail, params: { badgeId } })}
    />
  )
}

export function BadgeDetailScreen({ badgeId }: { badgeId: string }) {
  return <BadgeDetailPage badgeId={badgeId} onBack={useBackTo(ROUTES.badges)} />
}

export function AchievementsScreen() {
  const navigate = useNavigate()
  return (
    <AchievementsPage
      onBack={useBackTo(ROUTES.profile)}
      onOpenAchievement={(achievementId) =>
        navigate({ to: ROUTES.achievementDetail, params: { achievementId } })
      }
    />
  )
}

export function AchievementDetailScreen({ achievementId }: { achievementId: string }) {
  return (
    <AchievementDetailPage achievementId={achievementId} onBack={useBackTo(ROUTES.achievements)} />
  )
}
