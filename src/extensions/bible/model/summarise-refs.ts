import { compareNatural } from '@/shared/lib'
import { bookName } from './book-names'
import { parseRef, type VerseRef } from './reference'

export interface RefSummary {
  /** The references, collapsed into runs and capped — `Efeseni 3:6–9, 3:12`. */
  text: string
  /** How many parts the cap left out, for a "+{{count}} more" beside it. */
  more: number
}

interface Run {
  book: string
  chapter: number
  from: number
  to: number
}

/** A run reads with its book only when it opens a new book-and-chapter: `Efeseni 3:6–9, 3:12`. */
function render(run: Run, needsBook: boolean): string {
  const verses =
    run.to > run.from ? `${run.chapter}:${run.from}–${run.to}` : `${run.chapter}:${run.from}`
  return needsBook ? `${run.book} ${verses}` : verses
}

/** Consecutive verses of one chapter become one run; a gap starts another. */
function runsOf(refs: readonly VerseRef[]): Run[] {
  const runs: Run[] = []
  for (const ref of refs) {
    const last = runs[runs.length - 1]
    const book = bookName(ref.book)
    if (last && last.book === book && last.chapter === ref.chapter && ref.from === last.to + 1) {
      last.to = ref.to
      continue
    }
    runs.push({ book, chapter: ref.chapter, from: ref.from, to: ref.to })
  }
  return runs
}

/**
 * Names a set of verse references the way a person would: sorted, consecutive verses collapsed into
 * runs, the book stated once per chapter, and capped so twenty-eight of them never become a wall.
 * Anything in `plain` — a card whose front the learner wrote themselves — is kept verbatim at the
 * end rather than dropped: the message is about those cards too.
 */
export function summariseVerseRefs(
  refs: readonly VerseRef[],
  plain: readonly string[] = [],
  limit = 4,
): RefSummary {
  // The name is looked up once per reference, not once per comparison.
  const named = refs.map((ref) => ({ ref, name: bookName(ref.book) }))
  const sorted = named
    .toSorted(
      (a, b) =>
        compareNatural(a.name, b.name) ||
        a.ref.chapter - b.ref.chapter ||
        a.ref.from - b.ref.from ||
        a.ref.to - b.ref.to,
    )
    .map((entry) => entry.ref)

  const runs = runsOf(sorted)
  const parts = runs.map((run, index) => {
    const previous = runs[index - 1]
    const opensGroup = !previous || previous.book !== run.book || previous.chapter !== run.chapter
    return render(run, opensGroup)
  })

  const all = [...parts, ...plain]
  const shown = all.slice(0, limit)
  return { text: shown.join(', '), more: all.length - shown.length }
}

/** `summariseVerseRefs` over card fronts: a front that reads as a reference is one, the rest are plain. */
export function summariseRefs(fronts: readonly string[], limit = 4): RefSummary {
  const parsed: VerseRef[] = []
  const plain: string[] = []
  for (const front of fronts) {
    const ref = parseRef(front)
    if (ref) parsed.push(ref)
    else if (front.trim()) plain.push(front.trim())
  }
  return summariseVerseRefs(parsed, plain, limit)
}
