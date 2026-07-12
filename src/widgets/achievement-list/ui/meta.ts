import { Calendar, Crown, type LucideIcon, Star, Target, Trophy, Zap } from 'lucide-react'
import type { AchievementId } from '@/shared/lib'

export const ACHIEVEMENT_META = {
  'first-deck': {
    icon: Crown,
    titleKey: 'achievements.first-deck.title',
    descriptionKey: 'achievements.first-deck.description',
  },
  'week-warrior': {
    icon: Calendar,
    titleKey: 'achievements.week-warrior.title',
    descriptionKey: 'achievements.week-warrior.description',
  },
  'deck-master': {
    icon: Trophy,
    titleKey: 'achievements.deck-master.title',
    descriptionKey: 'achievements.deck-master.description',
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
