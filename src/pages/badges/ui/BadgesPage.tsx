import { useTranslation } from 'react-i18next'
import type { BadgeId } from '@/shared/lib'
import { BadgeGrid, NextMilestoneCard, RewardGridSkeleton, useRewards } from '@/widgets/rewards'
import { AppScreen, ScreenHeader, Skeleton } from '@/shared/ui'

export interface BadgesPageProps {
  onBack?: () => void
  onOpenBadge?: (id: BadgeId) => void
}

export function BadgesPage({ onBack, onOpenBadge }: BadgesPageProps = {}) {
  const { t } = useTranslation()
  const { ready, badges, milestone } = useRewards()

  return (
    <AppScreen
      fill
      className="pb-28"
      header={
        <ScreenHeader title={t('badges.title')} onBack={onBack} backLabel={t('common.back')} />
      }
    >
      {!ready ? (
        <BadgesSkeleton />
      ) : (
        <div className="mt-2 flex flex-col gap-5">
          <p className="px-1 text-(length:--p-text-label) text-muted-foreground">
            {t('badges.explainer')}
          </p>
          {milestone ? (
            <NextMilestoneCard badge={milestone} onOpen={() => onOpenBadge?.(milestone.id)} />
          ) : null}
          <BadgeGrid badges={badges} onOpenBadge={onOpenBadge} />
        </div>
      )}
    </AppScreen>
  )
}

function BadgesSkeleton() {
  return (
    <div aria-hidden className="mt-2 flex flex-col gap-5">
      <Skeleton className="h-3 w-44" />
      <Skeleton className="h-20 rounded-card" />
      <RewardGridSkeleton />
    </div>
  )
}
