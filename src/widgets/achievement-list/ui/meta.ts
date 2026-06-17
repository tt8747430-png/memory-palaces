import { Calendar, Crown, Star, Target, Trophy, Zap, type LucideIcon } from 'lucide-react'
import type { AchievementId } from '@/shared/lib'

/** Icon + literal i18n keys per milestone achievement. `as const satisfies` keeps the
 * key strings literal for the typed t() while checking every id is covered. */
export const ACHIEVEMENT_META = {
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
