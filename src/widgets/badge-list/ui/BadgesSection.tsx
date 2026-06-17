import { useTranslation } from 'react-i18next'
import type { Badge } from '@/shared/lib'
import { BadgeMedallion, CollectionPreview } from '@/shared/ui'
import { BADGE_META, compactNumber } from './meta'

export interface BadgesSectionProps {
  badges: ReadonlyArray<Badge>
  onSeeAll: () => void
}

const PREVIEW_COUNT = 4

/** Profile preview: the "Badges / See all" row with the first four tiered medallions,
 * each showing its highest reached threshold (or the first target while locked). */
export function BadgesSection({ badges, onSeeAll }: BadgesSectionProps) {
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
          <span key={badge.id} className="flex w-0 flex-1 flex-col items-center gap-1.5">
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
          </span>
        )
      })}
    </CollectionPreview>
  )
}
