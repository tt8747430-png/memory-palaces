import { useTranslation } from 'react-i18next'
import type { Achievement, AchievementId } from '@/shared/lib'
import { BadgeMedallion } from '@/shared/ui'
import { ACHIEVEMENT_META } from '@/widgets/rewards'
import { RewardGrid, RewardTile } from './RewardGrid'

export interface AchievementGridProps {
  achievements: ReadonlyArray<Achievement>
  onOpenAchievement?: (id: AchievementId) => void
}

export function AchievementGrid({ achievements, onOpenAchievement }: AchievementGridProps) {
  const { t } = useTranslation()
  return (
    <RewardGrid items={achievements} keyOf={(achievement) => achievement.id}>
      {(achievement) => {
        const meta = ACHIEVEMENT_META[achievement.id]
        const title = t(meta.titleKey)
        const status = t(achievement.earned ? 'achievements.earned' : 'achievements.locked')
        return (
          <RewardTile
            onOpen={onOpenAchievement ? () => onOpenAchievement(achievement.id) : undefined}
            ariaLabel={`${title}, ${status}`}
          >
            <BadgeMedallion
              icon={meta.icon}
              locked={!achievement.earned}
              showLock={!achievement.earned}
              showCheck={achievement.earned}
            />
            <div className="flex flex-col gap-0.5">
              <p
                className={
                  achievement.earned
                    ? 'text-(length:--p-text-label) font-bold leading-tight text-balance text-heading'
                    : 'text-(length:--p-text-label) font-bold leading-tight text-balance text-muted-foreground'
                }
              >
                {title}
              </p>
              <p
                className={
                  achievement.earned
                    ? 'text-(length:--p-text-tiny) font-bold leading-tight text-(--success-foreground)'
                    : 'text-(length:--p-text-tiny) font-semibold leading-tight text-muted-foreground'
                }
              >
                {status}
              </p>
            </div>
          </RewardTile>
        )
      }}
    </RewardGrid>
  )
}
