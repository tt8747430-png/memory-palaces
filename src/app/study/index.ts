/**
 * The study area's public API — model types, the progress store and its
 * repository token, and the progress/review commands (ADR-0008).
 *
 * This area has no pages: it is the SRS engine (session machine, grading,
 * scheduling, XP). `ui/session-reward` is imported directly by the lazy pages
 * that render it, for the reason given in `decks/index.ts`.
 */
export * from './model/progress'
export * from './data/progress-store'
export * from './commands/progress-index'
export * from './commands/review-index'
