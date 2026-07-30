import {
  type CardLike,
  cardsToAnkiTsv,
  cardsToCsv,
  contentSlug,
  downloadText,
  type QuestionLike,
  questionsToCsv,
} from '@/shared/lib'

export function exportCardsCsv(deckName: string, cards: ReadonlyArray<CardLike>): void {
  downloadText(`${contentSlug(deckName)}-cards.csv`, cardsToCsv(cards), 'text/csv')
}

export function exportQuestionsCsv(deckName: string, questions: ReadonlyArray<QuestionLike>): void {
  downloadText(`${contentSlug(deckName)}-questions.csv`, questionsToCsv(questions), 'text/csv')
}

export function exportCardsAnki(deckName: string, cards: ReadonlyArray<CardLike>): void {
  downloadText(`${contentSlug(deckName)}-anki.txt`, cardsToAnkiTsv(cards), 'text/plain')
}
