import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Achievement, AchievementId } from '@/shared/lib'
import { BadgeMedallion } from '@/shared/ui'
import { ACHIEVEMENT_META } from './meta'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

export interface AchievementGridProps {
  achievements: ReadonlyArray<Achievement>
  /** Tap a milestone to open its "how to earn it" detail. Omit for a display-only wall. */
  onOpenAchievement?: (id: AchievementId) => void
}

/** The full milestone wall: a 3-up grid of medallions with their title and a one-line
 * earned/locked status. With `onOpenAchievement` each tile is a button into the
 * milestone's detail screen. */
export function AchievementGrid({ achievements, onOpenAchievement }: AchievementGridProps) {
  const { t } = useTranslation()
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-7">
      {achievements.map((achievement, index) => {
        const meta = ACHIEVEMENT_META[achievement.id]
        const title = t(meta.titleKey)
        const status = t(achievement.earned ? 'achievements.earned' : 'achievements.locked')
        return (
          <motion.li
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, ease: EASE_OUT, duration: 0.3 }}
          >
            <AchievementTile
              onOpen={onOpenAchievement ? () => onOpenAchievement(achievement.id) : undefined}
              ariaLabel={`${title}, ${status}`}
            >
              <BadgeMedallion
                icon={meta.icon}
                locked={!achievement.earned}
                showLock={!achievement.earned}
              />
              <div className="flex flex-col gap-0.5">
                <p
                  className={
                    achievement.earned
                      ? 'text-[length:var(--p-text-label)] font-bold leading-tight text-heading'
                      : 'text-[length:var(--p-text-label)] font-bold leading-tight text-primary/50'
                  }
                >
                  {title}
                </p>
                <p
                  className={
                    achievement.earned
                      ? 'text-[length:var(--p-text-tiny)] font-bold leading-tight text-[var(--success-foreground)]'
                      : 'text-[length:var(--p-text-tiny)] font-semibold leading-tight text-muted-foreground'
                  }
                >
                  {status}
                </p>
              </div>
            </AchievementTile>
          </motion.li>
        )
      })}
    </ul>
  )
}

function AchievementTile({
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
