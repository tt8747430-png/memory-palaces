import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Award, Calendar, Crown, Star, Target, Trophy, Zap, type LucideIcon } from 'lucide-react'
import type { Achievement, AchievementId } from '@/shared/lib'
import { cn } from '@/shared/lib'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// Icon + literal i18n keys per badge. `as const satisfies` keeps the key strings literal
// so the typed t() accepts them while still checking every id is covered.
const ACHIEVEMENT_META = {
  'first-palace': {
    icon: Crown,
    titleKey: 'achievements.first-palace.title',
    descriptionKey: 'achievements.first-palace.description',
  },
  'week-warrior': {
    icon: Calendar,
    titleKey: 'achievements.week-warrior.title',
    descriptionKey: 'achievements.week-warrior.description',
  },
  'palace-master': {
    icon: Trophy,
    titleKey: 'achievements.palace-master.title',
    descriptionKey: 'achievements.palace-master.description',
  },
  'xp-champion': {
    icon: Zap,
    titleKey: 'achievements.xp-champion.title',
    descriptionKey: 'achievements.xp-champion.description',
  },
  perfectionist: {
    icon: Target,
    titleKey: 'achievements.perfectionist.title',
    descriptionKey: 'achievements.perfectionist.description',
  },
  'dedicated-learner': {
    icon: Star,
    titleKey: 'achievements.dedicated-learner.title',
    descriptionKey: 'achievements.dedicated-learner.description',
  },
} as const satisfies Record<
  AchievementId,
  { icon: LucideIcon; titleKey: string; descriptionKey: string }
>

export interface AchievementListProps {
  achievements: ReadonlyArray<Achievement>
}

/** Presentational badges list. Earned badges get a navy→accent icon tile and a gold
 * Award mark; locked badges read muted. Rows cascade in with a small stagger (reduced
 * motion drops the slide via the global MotionConfig). */
export function AchievementList({ achievements }: AchievementListProps) {
  const { t } = useTranslation()
  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <section>
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-[length:var(--p-text-title)] font-bold text-heading">
          {t('profile.badgesTitle')}
        </h2>
        <span className="rounded-full bg-info-surface px-3 py-1 text-[length:var(--p-text-label)] font-bold text-primary">
          {t('profile.badgeCount', { earned: earnedCount, total: achievements.length })}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {achievements.map((achievement, index) => {
          const meta = ACHIEVEMENT_META[achievement.id]
          const Icon = meta.icon
          return (
            <motion.li
              key={achievement.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, ease: EASE_OUT, duration: 0.3 }}
              className={cn(
                'flex items-center gap-4 rounded-card border p-4',
                achievement.earned
                  ? 'border-transparent bg-card shadow-rest'
                  : 'border-border bg-primary/[0.02]',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-14 shrink-0 place-items-center rounded-card',
                  achievement.earned
                    ? 'text-primary-foreground shadow-rest'
                    : 'bg-primary/[0.06] text-primary/30',
                )}
                style={
                  achievement.earned
                    ? { background: 'linear-gradient(135deg, var(--primary), var(--accent))' }
                    : undefined
                }
              >
                <Icon className="size-[26px]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5">
                  <h3
                    className={cn(
                      'text-[length:var(--p-text-sub)] font-bold',
                      achievement.earned ? 'text-heading' : 'text-primary/50',
                    )}
                  >
                    {t(meta.titleKey)}
                  </h3>
                  {achievement.earned ? (
                    <Award
                      className="size-[18px] shrink-0 text-[var(--warning)]"
                      fill="currentColor"
                      fillOpacity={0.4}
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p
                  className={cn(
                    'text-[length:var(--p-text-label)] font-medium leading-tight',
                    achievement.earned ? 'text-muted-foreground' : 'text-primary/45',
                  )}
                >
                  {t(meta.descriptionKey)}
                </p>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
