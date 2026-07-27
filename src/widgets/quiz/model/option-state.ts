export type OptionDisplay = 'idle' | 'selected' | 'correct' | 'wrong'

/** How an option should read right now: neutral, chosen, or judged once the answer is in. */
export function optionState(
  index: number,
  selected: number | null,
  answered: boolean,
  correctAnswer: number,
): OptionDisplay {
  if (answered) {
    if (index === correctAnswer) return 'correct'
    if (index === selected) return 'wrong'
    return 'idle'
  }
  return index === selected ? 'selected' : 'idle'
}
