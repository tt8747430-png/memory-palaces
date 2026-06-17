import { useTranslation } from 'react-i18next'
import type { Achievement } from '@/shared/lib'
import { BadgeMedallion, CollectionPreview } from '@/shared/ui'
import { ACHIEVEMENT_META } from './meta'

export interface AchievementsSectionProps {
  achievements: ReadonlyArray<Achievement>
  onSeeAll: () => void
}

const PREVIEW_COUNT = 4

/** Profile preview: the "Achievements / See all" row with the first four milestone
 * medallions (earned in the brand color, locked greyscale). */
export function AchievementsSection({ achievements, onSeeAll }: AchievementsSectionProps) {
  const { t } = useTranslation()
  return (
    <CollectionPreview
      title={t('profile.achievementsSection')}
      seeAllLabel={t('common.seeAll')}
      ariaLabel={t('profile.seeAllAchievements')}
      onSeeAll={onSeeAll}
    >
      {achievements.slice(0, PREVIEW_COUNT).map((achievement) => {
        const meta = ACHIEVEMENT_META[achievement.id]
        return (
          <span key={achievement.id} className="flex w-0 flex-1 flex-col items-center gap-1.5">
            <BadgeMedallion icon={meta.icon} locked={!achievement.earned} className="size-16" />
            <span className="w-full truncate text-center text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
              {t(meta.titleKey)}
            </span>
          </span>
        )
      })}
    </CollectionPreview>
  )
}
