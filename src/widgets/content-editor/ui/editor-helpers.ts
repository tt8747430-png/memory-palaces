/**
 * A question's fields as a command carries them. `explanation` is `undefined`
 * rather than absent when blank, matching `CardDraftEdit`, so clearing it
 * reaches `updateQuestion` as a real change rather than "leave it alone".
 */
export interface QuestionData {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation: string | undefined
}

export const MAX_OPTIONS = 6
export const MIN_OPTIONS = 2

export function buildQuestionData(
  prompt: string,
  options: string[],
  correct: number,
  explanation: string,
): QuestionData {
  const kept: string[] = []
  let newCorrect = 0
  options.forEach((o, i) => {
    if (o.trim()) {
      if (i === correct) newCorrect = kept.length
      kept.push(o.trim())
    }
  })
  return {
    prompt: prompt.trim(),
    options: kept,
    correctAnswer: newCorrect,
    explanation: explanation.trim() || undefined,
  }
}

export function isQuestionValid(prompt: string, options: string[], correct: number): boolean {
  const filled = options.map((o) => o.trim())
  return (
    prompt.trim().length > 0 &&
    filled.filter(Boolean).length >= MIN_OPTIONS &&
    (filled[correct]?.length ?? 0) > 0
  )
}
