/**
 * The settings area's public API — model types, the preferences store and its
 * repository token, and the commands that write it (ADR-0008).
 *
 * Pages and UI are absent by design: the composition root is eager, and a barrel
 * that reached into pages would pull them out of their lazy chunks.
 */
export * from './model/preferences'
export * from './data/preferences-store'
export * from './commands/set-preferences'
