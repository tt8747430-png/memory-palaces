/**
 * How a learner answered a card under Fast review. Absent means they have not seen it yet.
 *
 * It lives here rather than in `entities/card` because `shared` cannot import an entity, and the
 * deck-screen tally in `study-overview.ts` needs the same union the card field uses. The entity
 * re-exports it, so `Card.fastReview` remains the domain's word for it — the same arrangement
 * `CardStyleInput` uses for card styles.
 */
export const FAST_OUTCOMES = ['notQuite', 'gotIt'] as const
export type FastOutcome = (typeof FAST_OUTCOMES)[number]
