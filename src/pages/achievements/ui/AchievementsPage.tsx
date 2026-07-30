import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { type AchievementId, cn, EASE_OUT, levelFromXp } from '@/shared/lib'
import { AchievementGrid, RewardGridSkeleton, useRewards } from '@/widgets/rewards'
import { AppScreen, cardSurface, ScreenHeader, Skeleton } from '@/shared/ui'

export interface AchievementsPageProps {
  onBack?: () => void
  onOpenAchievement?: (id: AchievementId) => void
}

export function AchievementsPage({ onBack, onOpenAchievement }: AchievementsPageProps = {}) {
  const { t } = useTranslation()
  const { ready, achievements, totals, xp, longestStreak, bestQuizAccuracy, daysTrained } =
    useRewards()

  const records = [
    {
      id: 'level',
      value: String(levelFromXp(xp).level),
      label: t('achievementsPage.records.level'),
    },
    { id: 'streak', value: String(longestStreak), label: t('achievementsPage.records.streak') },
    { id: 'xp', value: xp.toLocaleString(), label: t('achievementsPage.records.xp') },
    {
      id: 'accuracy',
      value: `${bestQuizAccuracy}%`,
      label: t('achievementsPage.records.accuracy'),
    },
    {
      id: 'rooms',
      value: String(totals.decksCompleted),
      label: t('achievementsPage.records.decks'),
    },
    { id: 'days', value: String(daysTrained), label: t('achievementsPage.records.days') },
  ]

  return (
    <AppScreen
      fill
      className="pb-28"
      header={
        <ScreenHeader
          title={t('achievementsPage.title')}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      {!ready ? (
        <AchievementsSkeleton />
      ) : (
        <div className="mt-2 flex flex-col gap-6">
          <section>
            <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
              {t('achievementsPage.recordsTitle')}
            </h2>
            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className={cn(cardSurface, 'grid grid-cols-3 overflow-hidden')}
            >
              {records.map((record, index) => (
                <div
                  key={record.id}
                  className={cn(
                    'flex flex-col-reverse items-center gap-1 px-2 py-5 text-center',
                    index % 3 !== 0 && 'border-l border-border',
                    index >= 3 && 'border-t border-border',
                  )}
                >
                  <dt className="text-[length:var(--p-text-label)] font-medium leading-tight text-muted-foreground">
                    {record.label}
                  </dt>
                  <dd className="text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums text-heading">
                    {record.value}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </section>

          <section>
            <h2 className="px-1 text-[length:var(--p-text-title)] font-bold text-heading">
              {t('achievementsPage.milestonesTitle')}
            </h2>
            <p className="mb-4 mt-0.5 px-1 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('achievementsPage.milestonesSubtitle')}
            </p>
            <AchievementGrid achievements={achievements} onOpenAchievement={onOpenAchievement} />
          </section>
        </div>
      )}
    </AppScreen>
  )
}

function AchievementsSkeleton() {
  return (
    <div aria-hidden className="mt-2 flex flex-col gap-6">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-24 rounded-card" />
      <RewardGridSkeleton />
    </div>
  )
}
