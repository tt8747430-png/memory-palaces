import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { type Badge, cn, milestoneProgress } from '@/shared/lib'
import { BadgeMedallion, cardSurface, ProgressBar } from '@/shared/ui'
import { BADGE_META, compactNumber } from './meta'

export interface NextMilestoneCardProps {
  badge: Badge
  onOpen?: () => void
  className?: string
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

export function NextMilestoneCard({ badge, onOpen, className }: NextMilestoneCardProps) {
  const { t } = useTranslation()
  const meta = BADGE_META[badge.id]
  const remaining = (badge.next ?? badge.value) - badge.value
  const pct = Math.round(milestoneProgress(badge) * 100)
  const label = t(meta.titleKey)

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={cn(
        cardSurface,
        'flex w-full flex-col gap-3 p-4 text-left transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
    >
      <div className="flex items-center gap-3.5">
        <BadgeMedallion
          icon={meta.icon}
          tier={badge.tier + 1}
          value={badge.next != null ? compactNumber(badge.next) : undefined}
          className="size-14"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[length:var(--p-text-sub)] font-bold leading-tight text-heading">
            {t('profile.milestone.title')}
          </p>
          <p className="mt-0.5 text-[length:var(--p-text-label)] font-medium leading-snug text-muted-foreground">
            {t('profile.milestone.detail', { remaining, label })}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-0.5 text-[length:var(--p-text-sub)] font-bold tabular-nums text-primary">
          {pct}%
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </span>
      </div>

      <ProgressBar value={pct} />
    </motion.button>
  )
}
