import { useTranslation } from 'react-i18next'
import type { Achievement, AchievementId } from '@/shared/lib'
import { BadgeMedallion } from '@/shared/ui'
import { ACHIEVEMENT_META } from '@/widgets/rewards'
import { RewardPreview, RewardPreviewTile } from './RewardPreview'

export interface AchievementsSectionProps {
  achievements: ReadonlyArray<Achievement>
  onSeeAll: () => void
  onOpenAchievement: (id: AchievementId) => void
}

export function AchievementsSection({
  achievements,
  onSeeAll,
  onOpenAchievement,
}: AchievementsSectionProps) {
  const { t } = useTranslation()
  return (
    <RewardPreview
      title={t('profile.achievementsSection')}
      ariaLabel={t('profile.seeAllAchievements')}
      items={achievements}
      keyOf={(achievement) => achievement.id}
      onSeeAll={onSeeAll}
    >
      {(achievement) => {
        const meta = ACHIEVEMENT_META[achievement.id]
        return (
          <RewardPreviewTile
            onOpen={() => onOpenAchievement(achievement.id)}
            ariaLabel={t(meta.titleKey)}
          >
            <BadgeMedallion
              icon={meta.icon}
              locked={!achievement.earned}
              showCheck={achievement.earned}
              className="size-16"
            />
            <span className="w-full truncate text-center text-(length:--p-text-tiny) font-semibold text-muted-foreground">
              {t(meta.titleKey)}
            </span>
          </RewardPreviewTile>
        )
      }}
    </RewardPreview>
  )
}
