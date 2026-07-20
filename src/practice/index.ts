/**
 * The practice area's public API — the two session state machines and their types.
 *
 * Pages and UI stay out (ADR-0004): the composition root is eager, and the quiz/match routes
 * are lazy. `PracticeModes` and the session widgets are imported from `@/practice/ui` directly
 * by the surfaces that use them, exactly as the decks area exposes its own widgets.
 */
export * from './commands/quiz-index'
export * from './commands/match-index'
