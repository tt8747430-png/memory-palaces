import {
  contentSlug,
  downloadText,
  cardsToAnkiTsv,
  cardsToCsv,
  type ParsedCard,
  questionsToCsv,
  deckContentToJson,
} from '@/shared/lib'

type CardLike = { front: string; back: string; hint?: string }
type QuestionLike = {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

/** Download the full deck (cards + questions) as a round-trippable JSON export — cards keep
 * their cues, flag, known status, and schedule so a Mindscape import restores them. */
export function exportDeckJson(
  deckName: string,
  cards: ReadonlyArray<ParsedCard>,
  questions: ReadonlyArray<QuestionLike>,
): void {
  downloadText(
    `${contentSlug(deckName)}-content.json`,
    deckContentToJson(deckName, cards, questions),
    'application/json',
  )
}

/** Download the deck's cards as CSV (front,back,hint). */
export function exportCardsCsv(deckName: string, cards: ReadonlyArray<CardLike>): void {
  downloadText(`${contentSlug(deckName)}-cards.csv`, cardsToCsv(cards), 'text/csv')
}

/** Download the deck's questions as CSV. */
export function exportQuestionsCsv(deckName: string, questions: ReadonlyArray<QuestionLike>): void {
  downloadText(`${contentSlug(deckName)}-questions.csv`, questionsToCsv(questions), 'text/csv')
}

/** Download the deck's cards as Anki "Notes in Plain Text" (.txt). */
export function exportCardsAnki(deckName: string, cards: ReadonlyArray<CardLike>): void {
  downloadText(`${contentSlug(deckName)}-anki.txt`, cardsToAnkiTsv(cards), 'text/plain')
}
