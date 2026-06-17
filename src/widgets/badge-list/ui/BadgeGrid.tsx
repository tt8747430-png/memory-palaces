import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Badge } from '@/shared/lib'
import { BadgeMedallion } from '@/shared/ui'
import { BADGE_META, compactNumber } from './meta'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

export interface BadgeGridProps {
  badges: ReadonlyArray<Badge>
}

/** The full badge wall: a 3-up grid of tiered medallions, each with its title, the
 * "tier of total" progress, and a thin bar toward the next threshold. */
export function BadgeGrid({ badges }: BadgeGridProps) {
  const { t } = useTranslation()
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-7">
      {badges.map((badge, index) => {
        const meta = BADGE_META[badge.id]
        const face = badge.current ?? badge.next
        const locked = badge.tier === 0
        const prev = badge.tier > 1 ? (badge.tiers[badge.tier - 2] ?? 0) : 0
        const fill = badge.next
          ? Math.min(100, Math.round(((badge.value - prev) / (badge.next - prev)) * 100))
          : 100
        return (
          <motion.li
            key={badge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, ease: EASE_OUT, duration: 0.3 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <BadgeMedallion
              icon={meta.icon}
              tier={badge.tier}
              locked={locked}
              showLock={locked}
              value={face != null ? compactNumber(face) : undefined}
            />
            <div className="flex w-full flex-col items-center gap-1.5">
              <p className="text-[length:var(--p-text-label)] font-bold leading-tight text-heading">
                {t(meta.titleKey)}
              </p>
              <p className="text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
                {t('badges.tierProgress', { tier: badge.tier, total: badge.tiers.length })}
              </p>
              <span className="h-1 w-12 overflow-hidden rounded-full bg-primary/[0.08]">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${fill}%` }}
                  aria-hidden
                />
              </span>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
