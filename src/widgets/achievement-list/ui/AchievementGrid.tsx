import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Achievement } from '@/shared/lib'
import { BadgeMedallion } from '@/shared/ui'
import { ACHIEVEMENT_META } from './meta'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

export interface AchievementGridProps {
  achievements: ReadonlyArray<Achievement>
}

/** The full milestone wall: a 3-up grid of medallions with their title and a one-line
 * earned/locked status, so each badge teaches what it takes to earn it. */
export function AchievementGrid({ achievements }: AchievementGridProps) {
  const { t } = useTranslation()
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-7">
      {achievements.map((achievement, index) => {
        const meta = ACHIEVEMENT_META[achievement.id]
        return (
          <motion.li
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, ease: EASE_OUT, duration: 0.3 }}
            className="flex flex-col items-center gap-2 text-center"
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
                {t(meta.titleKey)}
              </p>
              <p className="text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
                {t(achievement.earned ? 'achievements.earned' : 'achievements.locked')}
              </p>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
