
export type BadgeId = 'xp' | 'streak' | 'decks' | 'library' | 'cards' | 'days'

export interface BadgeInput {
  xp: number
  longestStreak: number
  decksCompleted: number
  deckCount: number
  totalCards: number
  trainingDayCount: number
}

export interface Badge {
  id: BadgeId
  tiers: readonly number[]
  value: number
  tier: number
  current: number | null
  next: number | null
}

const TIERS = {
  xp: [1000, 2500, 5000, 10000, 25000],
  streak: [7, 30, 100, 365],
  decks: [10, 50, 100, 250],
  library: [1, 3, 10, 25],
  cards: [50, 200, 500, 1000],
  days: [10, 50, 100, 365],
} as const satisfies Record<BadgeId, readonly number[]>

const BADGE_ORDER: readonly BadgeId[] = ['xp', 'streak', 'decks', 'library', 'cards', 'days']

function metricFor(id: BadgeId, input: BadgeInput): number {
  switch (id) {
    case 'xp':
      return input.xp
    case 'streak':
      return input.longestStreak
    case 'decks':
      return input.decksCompleted
    case 'library':
      return input.deckCount
    case 'cards':
      return input.totalCards
    case 'days':
      return input.trainingDayCount
  }
}

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

export function milestoneProgress(badge: Badge): number {
  if (badge.next === null) return 1
  const floor = badge.current ?? 0
  const span = badge.next - floor
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (badge.value - floor) / span))
}

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
