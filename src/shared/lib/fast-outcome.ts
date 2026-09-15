export const FAST_OUTCOMES = ['notQuite', 'gotIt'] as const
export type FastOutcome = (typeof FAST_OUTCOMES)[number]
