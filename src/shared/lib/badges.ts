/**
 * Badges are tiered milestones derived live from existing progress — like
 * {@link computeAchievements}, there is no stored "earned" flag, so a badge's tier can
 * never drift from the truth behind it. This module is pure: it owns the canonical
 * badge order and the per-tier thresholds; icons, colors, and copy live in the widget
 * that renders them.
 */

export type BadgeId = 'xp' | 'streak' | 'rooms' | 'palaces' | 'cards' | 'days'

export interface BadgeInput {
  xp: number
  /** Best streak ever reached — a badge reflects a lifetime best, not today's count. */
  longestStreak: number
  roomsCompleted: number
  palaceCount: number
  totalCards: number
  trainingDayCount: number
}

export interface Badge {
  id: BadgeId
  /** Ascending thresholds; one per tier. */
  tiers: readonly number[]
  /** The live metric value this badge tracks. */
  value: number
  /** How many tiers are reached (0 = locked, `tiers.length` = maxed). */
  tier: number
  /** Highest threshold reached, or null when still locked. */
  current: number | null
  /** Next threshold to reach, or null when maxed. */
  next: number | null
}

/** Per-badge tier thresholds, chosen to be reachable yet meaningful. Ascending. */
const TIERS = {
  xp: [1000, 2500, 5000, 10000, 25000],
  streak: [7, 30, 100, 365],
  rooms: [10, 50, 100, 250],
  palaces: [1, 3, 10, 25],
  cards: [50, 200, 500, 1000],
  days: [10, 50, 100, 365],
} as const satisfies Record<BadgeId, readonly number[]>

/** Canonical display order. */
const BADGE_ORDER: readonly BadgeId[] = ['xp', 'streak', 'rooms', 'palaces', 'cards', 'days']

function metricFor(id: BadgeId, input: BadgeInput): number {
  switch (id) {
    case 'xp':
      return input.xp
    case 'streak':
      return input.longestStreak
    case 'rooms':
      return input.roomsCompleted
    case 'palaces':
      return input.palaceCount
    case 'cards':
      return input.totalCards
    case 'days':
      return input.trainingDayCount
  }
}

/** The six tiered badges in canonical order, each resolved against live progress. */
export function computeBadges(input: BadgeInput): Badge[] {
  return BADGE_ORDER.map((id) => {
    const tiers = TIERS[id]
    const value = metricFor(id, input)
    const tier = tiers.filter((threshold) => value >= threshold).length
    return {
      id,
      tiers,
      value,
      tier,
      current: tier > 0 ? tiers[tier - 1]! : null,
      next: tier < tiers.length ? tiers[tier]! : null,
    }
  })
}

/** Fraction (0–1) of the way from a badge's last reached tier to its next one. */
export function milestoneProgress(badge: Badge): number {
  if (badge.next === null) return 1
  const floor = badge.current ?? 0
  const span = badge.next - floor
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (badge.value - floor) / span))
}

/**
 * The badge the user is closest to leveling up — the one with the most progress toward
 * its next tier, so the profile can nudge "almost there" at the most reachable target.
 * Ignores maxed badges (no next tier) and, on a tie, keeps canonical order. Returns
 * null only when every badge is maxed.
 */
export function nextMilestone(badges: readonly Badge[]): Badge | null {
  let best: Badge | null = null
  let bestProgress = -1
  for (const badge of badges) {
    if (badge.next === null) continue
    const progress = milestoneProgress(badge)
    if (progress > bestProgress) {
      best = badge
      bestProgress = progress
    }
  }
  return best
}
