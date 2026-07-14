// A `type` on purpose: EventBus<T extends Record<string, unknown>> relies on
// the implicit index signature that interfaces don't get.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AppEvents = {
  'xp-gain': { amount: number }
  'level-up': { level: number }
  streak: { count: number }
  quiz: { accuracy: number; xp: number }
}
