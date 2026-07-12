import { useTranslation } from 'react-i18next'
import type { Badge, BadgeId } from '@/shared/lib'
import { BadgeMedallion, CollectionPreview, TierPips } from '@/shared/ui'
import { BADGE_META, compactNumber } from './meta'

export interface BadgesSectionProps {
  badges: ReadonlyArray<Badge>
  onSeeAll: () => void
  onOpenBadge: (id: BadgeId) => void
}

const PREVIEW_COUNT = 4

export function BadgesSection({ badges, onSeeAll, onOpenBadge }: BadgesSectionProps) {
  const { t } = useTranslation()
  return (
    <CollectionPreview
      title={t('profile.badgesSection')}
      seeAllLabel={t('common.seeAll')}
      ariaLabel={t('profile.seeAllBadges')}
      onSeeAll={onSeeAll}
    >
      {badges.slice(0, PREVIEW_COUNT).map((badge) => {
        const meta = BADGE_META[badge.id]
        const face = badge.current ?? badge.next
        return (
          <button
            key={badge.id}
            type="button"
            onClick={() => onOpenBadge(badge.id)}
            aria-label={t(meta.titleKey)}
            className="flex w-0 flex-1 flex-col items-center gap-1.5 rounded-card py-1 transition-transform duration-200 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <BadgeMedallion
              icon={meta.icon}
              tier={badge.tier}
              locked={badge.tier === 0}
              value={face != null ? compactNumber(face) : undefined}
              className="size-16"
            />
            <span className="w-full truncate text-center text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
              {t(meta.titleKey)}
            </span>
            <TierPips total={badge.tiers.length} filled={badge.tier} />
          </button>
        )
      })}
    </CollectionPreview>
  )
}
