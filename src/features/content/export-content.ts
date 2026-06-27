import {
  contentSlug,
  downloadText,
  lociToAnkiTsv,
  lociToCsv,
  questionsToCsv,
  roomContentToJson,
} from '@/shared/lib'

type LocusLike = { front: string; back: string; hint?: string }
type QuestionLike = { prompt: string; options: string[]; correctAnswer: number; explanation?: string }

/** Download the full room (cards + questions) as a round-trippable JSON export. */
export function exportRoomJson(
  roomName: string,
  loci: ReadonlyArray<LocusLike>,
  questions: ReadonlyArray<QuestionLike>,
): void {
  downloadText(
    `${contentSlug(roomName)}-content.json`,
    roomContentToJson(roomName, loci, questions),
    'application/json',
  )
}

/** Download the room's cards as CSV (front,back,hint). */
export function exportLociCsv(roomName: string, loci: ReadonlyArray<LocusLike>): void {
  downloadText(`${contentSlug(roomName)}-cards.csv`, lociToCsv(loci), 'text/csv')
}

/** Download the room's questions as CSV. */
export function exportQuestionsCsv(roomName: string, questions: ReadonlyArray<QuestionLike>): void {
  downloadText(`${contentSlug(roomName)}-questions.csv`, questionsToCsv(questions), 'text/csv')
}

/** Download the room's cards as Anki "Notes in Plain Text" (.txt). */
export function exportLociAnki(roomName: string, loci: ReadonlyArray<LocusLike>): void {
  downloadText(`${contentSlug(roomName)}-anki.txt`, lociToAnkiTsv(loci), 'text/plain')
}
