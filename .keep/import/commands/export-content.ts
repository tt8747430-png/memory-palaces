import {
  contentSlug,
  downloadText,
  cardsToAnkiTsv,
  cardsToCsv,
  questionsToCsv,
} from '@app/shared/domain'

interface CardLike {
  front: string
  back: string
  hint?: string
}
interface QuestionLike {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export function exportCardsCsv(deckName: string, cards: readonly CardLike[]): void {
  downloadText(`${contentSlug(deckName)}-cards.csv`, cardsToCsv(cards), 'text/csv')
}

export function exportQuestionsCsv(deckName: string, questions: readonly QuestionLike[]): void {
  downloadText(`${contentSlug(deckName)}-questions.csv`, questionsToCsv(questions), 'text/csv')
}

export function exportCardsAnki(deckName: string, cards: readonly CardLike[]): void {
  downloadText(`${contentSlug(deckName)}-anki.txt`, cardsToAnkiTsv(cards), 'text/plain')
}
