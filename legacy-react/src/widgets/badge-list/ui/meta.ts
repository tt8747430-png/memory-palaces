import {
  Building2,
  CalendarCheck,
  DoorOpen,
  Flame,
  Layers,
  type LucideIcon,
  Zap,
} from 'lucide-react'
import type { BadgeId } from '@/shared/lib'

export const BADGE_META = {
  xp: { icon: Zap, titleKey: 'badges.xp.title' },
  streak: { icon: Flame, titleKey: 'badges.streak.title' },
  decks: { icon: DoorOpen, titleKey: 'badges.decks.title' },
  library: { icon: Building2, titleKey: 'badges.library.title' },
  cards: { icon: Layers, titleKey: 'badges.cards.title' },
  days: { icon: CalendarCheck, titleKey: 'badges.days.title' },
} as const satisfies Record<BadgeId, { icon: LucideIcon; titleKey: string }>

export function compactNumber(value: number): string {
  if (value < 1000) return String(value)
  const thousands = value / 1000
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`
}
