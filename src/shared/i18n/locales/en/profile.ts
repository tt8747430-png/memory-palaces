export const profile = {
  guest: 'Exploring as a guest',
  achievements: 'Achievements',
  openSettings: 'Open settings',
  badgesSection: 'Badges',
  achievementsSection: 'Achievements',
  seeAllBadges: 'See all badges',
  seeAllAchievements: 'See all achievements',
  handle: '@{{handle}}',
  handleJoined: '@{{handle}} · Joined {{year}}',
  editPhoto: 'Edit profile photo',
  openStreak: 'Open streak',
  milestone: {
    title: 'Almost there',
    detail: '{{remaining}} more to your next {{label}} badge',
  },
  tiles: {
    decks: 'Decks',
    totalXp: 'Total XP',
    currentStreak: 'Day streak',
  },
} as const

export const achievements = {
  'first-deck': {
    title: 'First Deck',
    description: 'Created your first deck',
  },
  'week-warrior': {
    title: 'Week Warrior',
    description: 'Kept a 7-day training streak',
  },
  'deck-master': {
    title: 'Deck Master',
    description: 'Mastered every card in a deck',
  },
  'xp-champion': {
    title: 'XP Champion',
    description: 'Earned 2,000 XP',
  },
  perfectionist: {
    title: 'Perfectionist',
    description: 'Scored 100% on a quiz',
  },
  'dedicated-learner': {
    title: 'Dedicated Learner',
    description: 'Completed 10 decks',
  },
  earned: 'Earned',
  locked: 'Locked',
} as const

export const badges = {
  title: 'Badges',
  subtitle: '{{earned}} of {{total}} badges started',
  explainer: 'Level these up as you train.',
  tierProgress: '{{tier}} of {{total}}',
  xp: {
    title: 'XP Collector',
    blurb: 'Earn XP every time you study cards, finish a review, or complete a deck.',
  },
  streak: {
    title: 'Streak Keeper',
    blurb: 'Train at least once a day to grow your longest streak.',
  },
  decks: {
    title: 'Deck Finisher',
    blurb: 'Master a deck by recalling every card in it, then move to the next one.',
  },
  library: {
    title: 'Library Builder',
    blurb: 'Grow your library of decks, each a subject you are learning by heart.',
  },
  cards: {
    title: 'Card Keeper',
    blurb: 'Add cards to your decks. Every card you create counts toward this badge.',
  },
  days: {
    title: 'Daily Devotion',
    blurb: 'Show up to train. Each separate day you practice adds to the count.',
  },
} as const

export const badgeDetail = {
  tierOf: 'Tier {{tier}} of {{total}}',
  locked: 'Not started',
  howToTitle: 'How to earn it',
  ladderTitle: 'Tiers',
  tierLabel: 'Tier {{n}}',
  reached: 'Reached',
  inProgress: '{{remaining}} to go',
  upcoming: 'Locked',
  maxed: 'Every tier earned. Nicely done.',
  nowValue: 'You: {{value}}',
} as const

export const achievementDetail = {
  earned: 'Earned',
  locked: 'Not earned yet',
  howToTitle: 'How to earn it',
  earnedNote: "You've earned this one. It stays yours.",
  'first-deck': {
    howTo: 'Open Home, tap the plus, and create your first deck.',
  },
  'week-warrior': {
    howTo: 'Train on seven days in a row. A few minutes a day keeps the streak alive.',
  },
  'deck-master': {
    howTo: 'Master one deck by recalling every card in its subtree.',
  },
  'xp-champion': {
    howTo: 'Keep training and reviewing. XP adds up across every session you do.',
  },
  perfectionist: {
    howTo: 'Score 100% on a deck test. Study the cards first, then take the test.',
  },
  'dedicated-learner': {
    howTo: 'Complete ten decks by mastering every card in each.',
  },
} as const

export const achievementsPage = {
  title: 'Achievements',
  recordsTitle: 'Personal records',
  milestonesTitle: 'Milestones',
  milestonesSubtitle: 'Earn these once.',
  records: {
    level: 'Level',
    streak: 'Longest streak',
    xp: 'Total XP',
    accuracy: 'Best accuracy',
    decks: 'Decks done',
    days: 'Days trained',
  },
} as const

export const streak = {
  title: 'Streak',
  dayStreak: 'day streak',
  keepItUp: 'Keep the flame alive: train today to extend your streak.',
  startToday: 'Train today to light your streak.',
  daysThisMonth: 'Days this month',
  longest: 'Longest streak',
} as const

export const progress = {
  level: 'Level {{level}}',
  xpToNext: '{{remaining}} XP to level {{level}}',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  legendTrained: 'Trained',
  legendToday: 'Today',
} as const
