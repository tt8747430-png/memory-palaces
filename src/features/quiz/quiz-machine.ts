/**
 * The multiple-choice quiz State machine (pure, no IO). It owns the run — the
 * cursor, the selection, the reveal, the running score/streak — never the
 * questions themselves; the widget holds those and tells the machine, on
 * `submit`, only whether the choice was correct. Scoring lives here so it stays
 * testable and the AI Tutor can reuse it later.
 */
export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  /** Index into `options` of the correct choice. */
  correctAnswer: number
  roomTitle: string
  explanation?: string
}

export interface AnsweringState {
  status: 'answering'
  index: number
  total: number
  /** The chosen option, or null before a choice is made. */
  selected: number | null
  /** True once submitted/timed-out — the reveal is showing. */
  answered: boolean
  score: number
  /** Consecutive correct answers, for the "on a roll" cue. */
  streak: number
}

export interface QuizCompleteState {
  status: 'complete'
  score: number
  total: number
}

export type QuizState = AnsweringState | QuizCompleteState

export type QuizAction =
  | { type: 'select'; option: number }
  | { type: 'submit'; correct: boolean }
  | { type: 'timeout' }
  | { type: 'next' }
  | { type: 'skip' }
  | { type: 'restart' }

export function initQuiz(total: number): QuizState {
  if (total <= 0) return { status: 'complete', score: 0, total: 0 }
  return {
    status: 'answering',
    index: 0,
    total,
    selected: null,
    answered: false,
    score: 0,
    streak: 0,
  }
}

/** Move past the current question — to the next, or to completion at the end. */
function advance(state: AnsweringState, score: number): QuizState {
  if (state.index >= state.total - 1) {
    return { status: 'complete', score, total: state.total }
  }
  return {
    ...state,
    index: state.index + 1,
    selected: null,
    answered: false,
    score,
    streak: state.streak,
  }
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'select': {
      if (state.status !== 'answering' || state.answered) return state
      return { ...state, selected: action.option }
    }

    case 'submit': {
      if (state.status !== 'answering' || state.answered || state.selected === null) return state
      return {
        ...state,
        answered: true,
        score: action.correct ? state.score + 1 : state.score,
        streak: action.correct ? state.streak + 1 : 0,
      }
    }

    case 'timeout': {
      if (state.status !== 'answering' || state.answered) return state
      return { ...state, answered: true, streak: 0 }
    }

    case 'next': {
      if (state.status !== 'answering' || !state.answered) return state
      return advance(state, state.score)
    }

    case 'skip': {
      if (state.status !== 'answering') return state
      return { ...advance({ ...state, streak: 0 }, state.score) }
    }

    case 'restart':
      return initQuiz(state.total)

    default:
      return state
  }
}

/** Rounded percentage of correct answers; 0 for an empty quiz. */
export function quizAccuracy(score: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}
