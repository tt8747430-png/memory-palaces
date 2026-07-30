import { useTranslation } from 'react-i18next'
import type { Badge, BadgeId } from '@/shared/lib'
import { BadgeMedallion, TierPips } from '@/shared/ui'
import { BADGE_META, compactNumber } from '@/widgets/rewards'
import { RewardPreview, RewardPreviewTile } from './RewardPreview'

export interface BadgesSectionProps {
  badges: ReadonlyArray<Badge>
  onSeeAll: () => void
  onOpenBadge: (id: BadgeId) => void
}

export function BadgesSection({ badges, onSeeAll, onOpenBadge }: BadgesSectionProps) {
  const { t } = useTranslation()
  return (
    <RewardPreview
      title={t('profile.badgesSection')}
      ariaLabel={t('profile.seeAllBadges')}
      items={badges}
      keyOf={(badge) => badge.id}
      onSeeAll={onSeeAll}
    >
      {(badge) => {
        const meta = BADGE_META[badge.id]
        const face = badge.current ?? badge.next
        return (
          <RewardPreviewTile onOpen={() => onOpenBadge(badge.id)} ariaLabel={t(meta.titleKey)}>
            <BadgeMedallion
              icon={meta.icon}
              tier={badge.tier}
              locked={badge.tier === 0}
              value={face != null ? compactNumber(face) : undefined}
              className="size-16"
            />
            <span className="w-full truncate text-center text-(length:--p-text-tiny) font-semibold text-muted-foreground">
              {t(meta.titleKey)}
            </span>
            <TierPips total={badge.tiers.length} filled={badge.tier} />
          </RewardPreviewTile>
        )
      }}
    </RewardPreview>
  )
}
