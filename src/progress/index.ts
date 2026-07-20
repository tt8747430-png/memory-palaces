/**
 * The progress area's public API — the progress model, the progress store, and
 * the XP/streak/reward commands (ADR-0004; extracted from `study/` in the React
 * return, which the Angular port never split out).
 *
 * `study/` is the SRS engine and owns none of this. The progress hub pages
 * (profile, streak, badges, achievements) land in a later phase; like every
 * area, they stay out of this barrel — the composition root is eager.
 */
export * from './model/progress'
export * from './data/progress-store'
export * from './commands/progress-index'
