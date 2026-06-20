import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Badge, BadgeId } from '@/shared/lib'
import { BadgeMedallion, TierPips } from '@/shared/ui'
import { BADGE_META, compactNumber } from './meta'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

export interface BadgeGridProps {
  badges: ReadonlyArray<Badge>
  /** Tap a badge to open its "how to earn it" detail. Omit for a display-only wall. */
  onOpenBadge?: (id: BadgeId) => void
}

/** The full badge wall: a 3-up grid of tiered medallions, each with its title, the
 * "tier of total" progress, and a thin bar toward the next threshold. With `onOpenBadge`
 * each tile is a button into the badge's detail screen. */
export function BadgeGrid({ badges, onOpenBadge }: BadgeGridProps) {
  const { t } = useTranslation()
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-7">
      {badges.map((badge, index) => {
        const meta = BADGE_META[badge.id]
        const face = badge.current ?? badge.next
        const locked = badge.tier === 0
        const title = t(meta.titleKey)
        const tierProgress = t('badges.tierProgress', {
          tier: badge.tier,
          total: badge.tiers.length,
        })
        return (
          <motion.li
            key={badge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, ease: EASE_OUT, duration: 0.3 }}
          >
            <BadgeTile
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
            </BadgeTile>
          </motion.li>
        )
      })}
    </ul>
  )
}

/** Tile shell: a button into the detail screen when `onOpen` is set (press + focus
 * feedback, the medallion dips under the press), else a plain static stack. */
function BadgeTile({
  onOpen,
  ariaLabel,
  children,
}: {
  onOpen?: () => void
  ariaLabel: string
  children: ReactNode
}) {
  const className = 'flex w-full flex-col items-center gap-2 text-center'
  if (!onOpen) return <div className={className}>{children}</div>
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className={`${className} rounded-card py-1 transition-transform duration-200 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
    >
      {children}
    </button>
  )
}
