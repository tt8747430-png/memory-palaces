import {
  type Grade,
  markKnown,
  markLearning,
  schedule,
  scheduleOn,
  type SrsState,
  type SrsStatus,
  srsStatus,
} from './srs'

/**
 * One pending edit to a card's schedule.
 *
 * `shaped` is what the learner set by hand — a status, a review day — and
 * `grade` is an answer laid on top of it. Keeping the two apart is what lets
 * the controls compose in both directions: re-tapping a grade recomputes
 * instead of compounding, and shaping the card after grading keeps the grade's
 * work rather than throwing it away.
 */
export interface CardProgressDraft {
  /** The card as stored, so we can tell whether anything actually moved. */
  stored: SrsState | undefined
  shaped: SrsState | undefined
  grade: Grade | undefined
  /** The moment the edit began; every preview is measured from it. */
  at: number
}

export function draftFrom(srs: SrsState | undefined, at: number): CardProgressDraft {
  return { stored: srs, shaped: srs, grade: undefined, at }
}

/** The schedule this draft would write. */
export function draftSchedule(draft: CardProgressDraft): SrsState | undefined {
  return draft.grade ? schedule(draft.shaped, draft.grade, draft.at) : draft.shaped
}

export function draftStatus(draft: CardProgressDraft): SrsStatus {
  return srsStatus(draftSchedule(draft))
}

/** What a grade would do to the draft as it stands, for the button captions. */
export function gradePreview(draft: CardProgressDraft, grade: Grade): SrsState {
  return schedule(draft.shaped, grade, draft.at)
}

export function withGrade(draft: CardProgressDraft, grade: Grade): CardProgressDraft {
  return { ...draft, grade }
}

export function withStatus(draft: CardProgressDraft, status: SrsStatus): CardProgressDraft {
  const from = draftSchedule(draft)
  const shaped =
    status === 'new'
      ? undefined
      : status === 'known'
        ? markKnown(from, draft.at)
        : markLearning(from, draft.at)
  return { ...draft, shaped, grade: undefined }
}

export function withDue(draft: CardProgressDraft, dueMs: number): CardProgressDraft {
  return { ...draft, shaped: scheduleOn(draftSchedule(draft), dueMs, draft.at), grade: undefined }
}

export function draftDiffersFromCard(draft: CardProgressDraft): boolean {
  return !sameSchedule(draft.stored, draftSchedule(draft))
}

function sameSchedule(a: SrsState | undefined, b: SrsState | undefined): boolean {
  if (!a || !b) return a === b
  return (
    a.due === b.due &&
    a.interval === b.interval &&
    a.ease === b.ease &&
    a.reps === b.reps &&
    a.lapses === b.lapses
  )
}
