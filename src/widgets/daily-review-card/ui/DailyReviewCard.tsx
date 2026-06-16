import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Layers } from 'lucide-react'
import { cn } from '@/shared/lib'
import { cardSurface } from '@/shared/ui'

export interface DailyReviewCardProps {
  dueCount: number
  onOpen: () => void
  className?: string
}

/** The cross-library due-card shortcut. Hidden when nothing is due; otherwise a card
 * with the due count routing into Daily Review. */
export function DailyReviewCard({ dueCount, onOpen, className }: DailyReviewCardProps) {
  const { t } = useTranslation()
  if (dueCount <= 0) return null

  const label = t(dueCount === 1 ? 'home.dailyReviewDueOne' : 'home.dailyReviewDueOther', {
    count: dueCount,
  })

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className={cn(cardSurface, 'flex w-full items-center gap-4 p-4 text-left', className)}
    >
      <span className="relative shrink-0">
        <span className="grid size-12 place-items-center rounded-card bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-interactive">
          <Layers className="size-6" aria-hidden />
        </span>
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-card bg-[var(--warning)] px-1 text-[11px] font-bold leading-none text-[var(--warning-on-fill)]">
          {dueCount > 99 ? '99+' : dueCount}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[length:var(--p-text-sub)] font-bold text-heading">
          {t('home.dailyReviewTitle')}
        </span>
        <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
          {label}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </motion.button>
  )
}
