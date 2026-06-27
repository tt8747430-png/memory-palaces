import { Building2, CalendarCheck, DoorOpen, Flame, Layers, type LucideIcon, Zap, } from 'lucide-react'
import type { BadgeId } from '@/shared/lib'

/** Icon + i18n title per tiered badge. `as const satisfies` keeps the key strings
 * literal for the typed t() while checking every id is covered. */
export const BADGE_META = {
  xp: { icon: Zap, titleKey: 'badges.xp.title' },
  streak: { icon: Flame, titleKey: 'badges.streak.title' },
  rooms: { icon: DoorOpen, titleKey: 'badges.rooms.title' },
  palaces: { icon: Building2, titleKey: 'badges.palaces.title' },
  cards: { icon: Layers, titleKey: 'badges.cards.title' },
  days: { icon: CalendarCheck, titleKey: 'badges.days.title' },
} as const satisfies Record<BadgeId, { icon: LucideIcon; titleKey: string }>

/** Compact a threshold for a medallion face: 2500 → "2.5K", 25000 → "25K". */
export function compactNumber(value: number): string {
  if (value < 1000) return String(value)
  const thousands = value / 1000
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`
}
