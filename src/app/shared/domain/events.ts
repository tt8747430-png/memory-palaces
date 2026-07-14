export interface AppEvents {
  'xp-gain': { amount: number }
  'level-up': { level: number }
  streak: { count: number }
  quiz: { accuracy: number; xp: number }
}
