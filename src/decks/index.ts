/**
 * The decks area's public API — what other areas may depend on (ADR-0008).
 *
 * Deliberately narrow: model types, stores, and commands. Pages and UI are
 * absent by design, and not an oversight: the composition root is eager, so a
 * barrel that reached into pages would drag every lazily-routed deck page into
 * the initial bundle. Components are imported directly by the templates that use
 * them.
 *
 * `data/schemas` is likewise absent — RxDB schemas are infrastructure the
 * composition root wires, not something another area should reach for.
 */
export * from './model/deck'
export * from './model/deck-appearance'
export * from './model/card'
export * from './model/question'
export * from './model/folder'
export * from './model/folder-appearance'
export * from './data/stores'
export * from './commands/deck-index'
export * from './commands/card-index'
export * from './commands/question-index'
export * from './commands/folder-index'
