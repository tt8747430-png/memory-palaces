import { useTranslation } from 'react-i18next'
import type { Achievement, AchievementId } from '@/shared/lib'
import { BadgeMedallion, CollectionPreview } from '@/shared/ui'
import { ACHIEVEMENT_META } from './meta'

export interface AchievementsSectionProps {
  achievements: ReadonlyArray<Achievement>
  onSeeAll: () => void
  /** Open a single milestone's detail; medallions are tappable, matching the full wall. */
  onOpenAchievement: (id: AchievementId) => void
}

const PREVIEW_COUNT = 4

/** Profile preview: the "Achievements / See all" row with the first four milestone
 * medallions. Earned ones carry a success check (the one-shot "done" mark), locked ones
 * stay dim — no tier pips, the visible difference from the tiered badges. */
export function AchievementsSection({
  achievements,
  onSeeAll,
  onOpenAchievement,
}: AchievementsSectionProps) {
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
          <button
            key={achievement.id}
            type="button"
            onClick={() => onOpenAchievement(achievement.id)}
            aria-label={t(meta.titleKey)}
            className="flex w-0 flex-1 flex-col items-center gap-1.5 rounded-card py-1 transition-transform duration-200 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <BadgeMedallion
              icon={meta.icon}
              locked={!achievement.earned}
              showCheck={achievement.earned}
              className="size-16"
            />
            <span className="w-full truncate text-center text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
              {t(meta.titleKey)}
            </span>
          </button>
        )
      })}
    </CollectionPreview>
  )
}
