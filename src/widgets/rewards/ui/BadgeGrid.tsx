import { useTranslation } from 'react-i18next'
import type { Badge, BadgeId } from '@/shared/lib'
import { BadgeMedallion, TierPips } from '@/shared/ui'
import { BADGE_META, compactNumber } from '../model/badge-meta'
import { RewardGrid, RewardTile } from './RewardGrid'

export interface BadgeGridProps {
  badges: ReadonlyArray<Badge>
  onOpenBadge?: (id: BadgeId) => void
}

export function BadgeGrid({ badges, onOpenBadge }: BadgeGridProps) {
  const { t } = useTranslation()
  return (
    <RewardGrid items={badges} keyOf={(badge) => badge.id}>
      {(badge) => {
        const meta = BADGE_META[badge.id]
        const face = badge.current ?? badge.next
        const locked = badge.tier === 0
        const title = t(meta.titleKey)
        const tierProgress = t('badges.tierProgress', {
          tier: badge.tier,
          total: badge.tiers.length,
        })
        return (
          <RewardTile
            onOpen={onOpenBadge ? () => onOpenBadge(badge.id) : undefined}
            ariaLabel={`${title}, ${tierProgress}`}
          >
            <BadgeMedallion
              icon={meta.icon}
              tier={badge.tier}
              locked={locked}
              showLock={locked}
              value={face != null ? compactNumber(face) : undefined}
            />
            <div className="flex w-full flex-col items-center gap-1.5">
              <p className="text-[length:var(--p-text-label)] font-bold leading-tight text-balance text-heading">
                {title}
              </p>
              <p className="text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
                {tierProgress}
              </p>
              <TierPips total={badge.tiers.length} filled={badge.tier} className="mt-0.5" />
            </div>
          </RewardTile>
        )
      }}
    </RewardGrid>
  )
}
