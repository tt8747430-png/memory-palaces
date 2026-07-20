/**
 * The notifications area's public API — model types, the store, and the one
 * command other areas raise (ADR-0008).
 *
 * `mark-all-read` is absent on purpose: only this area's own page calls it, so
 * it is internal. Pages and UI are absent for the reason given in
 * `decks/index.ts` — the composition root is eager.
 */
export * from './model/notification'
export * from './data/notification-store'
export * from './commands/record-notification'
