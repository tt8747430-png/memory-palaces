export interface CardData {
  front: string
  back: string
  hint?: string
  tip?: string
}

export interface QuestionData {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export const MAX_OPTIONS = 6
export const MIN_OPTIONS = 2

/** Trim option strings, drop the empties, and re-point `correctAnswer` at the kept option —
 * shared by the sheet and page so the persisted shape is identical from either entry point. */
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
    ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
  }
}

/** Whether the current option set + prompt + correct pick is a valid question. */
export function isQuestionValid(prompt: string, options: string[], correct: number): boolean {
  const filled = options.map((o) => o.trim())
  return (
    prompt.trim().length > 0 &&
    filled.filter(Boolean).length >= MIN_OPTIONS &&
    (filled[correct]?.length ?? 0) > 0
  )
}
