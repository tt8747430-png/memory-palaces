import { useTranslation } from 'react-i18next'
import { Check, Lock } from 'lucide-react'
import type { AchievementId } from '@/shared/lib'
import { ACHIEVEMENT_META, RewardHero, useRewards } from '@/widgets/rewards'
import { AppScreen, cardSurface, ScreenHeader } from '@/shared/ui'

const ACHIEVEMENT_IDS: readonly AchievementId[] = [
  'first-deck',
  'week-warrior',
  'deck-master',
  'xp-champion',
  'perfectionist',
  'dedicated-learner',
]
const isAchievementId = (value: string): value is AchievementId =>
  (ACHIEVEMENT_IDS as readonly string[]).includes(value)

export interface AchievementDetailPageProps {
  achievementId: string
  onBack?: () => void
}

export function AchievementDetailPage({ achievementId, onBack }: AchievementDetailPageProps) {
  const { t } = useTranslation()
  const { achievements } = useRewards()

  const achievement = isAchievementId(achievementId)
    ? achievements.find((entry) => entry.id === achievementId)
    : undefined

  if (!achievement) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('achievementsPage.title')}
            onBack={onBack}
            backLabel={t('common.back')}
          />
        }
      />
    )
  }

  const meta = ACHIEVEMENT_META[achievement.id]
  const title = t(meta.titleKey)
  const earned = achievement.earned

  return (
    <AppScreen
      fill
      className="pb-28"
      header={<ScreenHeader title={title} onBack={onBack} backLabel={t('common.back')} />}
    >
      <div className="mt-2 flex flex-col gap-6">
        <RewardHero icon={meta.icon} glow={earned} locked={!earned} shine={earned}>
          <span
            className={
              earned
                ? 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--success-surface)] px-3 py-1 text-[length:var(--p-text-label)] font-bold text-[var(--success-on-surface)]'
                : 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-info-surface px-3 py-1 text-[length:var(--p-text-label)] font-bold text-info-foreground'
            }
          >
            {earned ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Lock className="size-3.5" aria-hidden />
            )}
            {t(earned ? 'achievementDetail.earned' : 'achievementDetail.locked')}
          </span>
        </RewardHero>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('achievementDetail.howToTitle')}
          </h2>
          <p className="px-1 text-[length:var(--p-text-body)] leading-relaxed text-foreground">
            {t(`achievementDetail.${achievement.id}.howTo`)}
          </p>
        </section>

        <div className={`${cardSurface} flex items-start gap-3 p-4`}>
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-control bg-info-surface text-info-foreground">
            <meta.icon className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[length:var(--p-text-sub)] font-bold leading-tight text-heading">
              {title}
            </p>
            <p className="mt-0.5 text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
              {t(meta.descriptionKey)}
            </p>
          </div>
        </div>

        {earned ? (
          <p className="px-1 text-[length:var(--p-text-label)] font-semibold text-[var(--success-foreground)]">
            {t('achievementDetail.earnedNote')}
          </p>
        ) : null}
      </div>
    </AppScreen>
  )
}
