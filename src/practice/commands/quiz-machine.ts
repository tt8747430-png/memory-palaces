export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctAnswer: number
  deckName: string
  explanation?: string
}

export interface AnsweringState {
  status: 'answering'
  index: number
  total: number
  selected: number | null
  answered: boolean
  score: number
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

export function quizAccuracy(score: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}
