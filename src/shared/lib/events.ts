/**
 * The app-wide domain event map carried on the {@link EventBus} (Observer/Mediator).
 * Features publish these; widgets and the notification bridge subscribe — neither
 * imports the other. Lives in `shared` (not the composition root) so any layer can
 * type the bus without depending on `app`. A `type` (not `interface`) so it satisfies
 * the bus's `Record<string, unknown>` constraint.
 */
export type AppEvents = {
  'xp-gain': { amount: number }
  'level-up': { level: number }
  streak: { count: number }
  quiz: { accuracy: number; xp: number }
}
