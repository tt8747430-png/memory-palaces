export interface StreakState {
  streakCount: number
  longestStreak: number
  lastTrainingDate: string | null
  streakFreezes: number
  trainingDays: string[]
}

export interface StreakResult {
  state: StreakState
  alreadyTrainedToday: boolean
  continued: boolean
  usedFreeze: boolean
  isMilestone: boolean
  isNewStreak: boolean
}

const MAX_STREAK_FREEZES = 2
const HISTORY_DAYS = 365
const MILESTONE_INTERVAL = 7
const DAY_MS = 86_400_000

export function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

function shiftDayKey(key: string, daysBack: number): string {
  const date = new Date(`${key}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - daysBack)
  return date.toISOString().slice(0, 10)
}

export function recordTrainingDay(state: StreakState, now: number): StreakResult {
  const today = dayKey(now)
  if (state.trainingDays.includes(today)) {
    return {
      state,
      alreadyTrainedToday: true,
      continued: false,
      usedFreeze: false,
      isMilestone: false,
      isNewStreak: false,
    }
  }

  const trainingDays = [...state.trainingDays, today].slice(-HISTORY_DAYS)
  const yesterday = shiftDayKey(today, 1)
  const dayBefore = shiftDayKey(today, 2)

  const isConsecutive = state.lastTrainingDate === yesterday || state.lastTrainingDate === today
  const usedFreeze =
    !isConsecutive && state.lastTrainingDate === dayBefore && state.streakFreezes > 0
  const continued = isConsecutive || usedFreeze

  const streakCount = continued ? state.streakCount + 1 : 1
  const isNewStreak = continued && streakCount > state.streakCount
  const isMilestone = isNewStreak && streakCount % MILESTONE_INTERVAL === 0

  let streakFreezes = state.streakFreezes - (usedFreeze ? 1 : 0)
  if (isMilestone) streakFreezes = Math.min(MAX_STREAK_FREEZES, streakFreezes + 1)

  return {
    state: {
      streakCount,
      longestStreak: Math.max(state.longestStreak, streakCount),
      lastTrainingDate: today,
      streakFreezes,
      trainingDays,
    },
    alreadyTrainedToday: false,
    continued,
    usedFreeze,
    isMilestone,
    isNewStreak,
  }
}

export interface DailyTally {
  activeDayKey: string | null
  activeDayCount: number
}

export interface PracticeOutcome {
  streak: StreakState
  tally: DailyTally
  state: StreakState & DailyTally
  dayCount: number
  dailyGoal: number
  becameActive: boolean
  result: StreakResult | null
}

export function recordPractice(
  state: StreakState & DailyTally,
  itemsPracticed: number,
  dailyGoal: number,
  now: number,
): PracticeOutcome {
  const today = dayKey(now)
  const carried = state.activeDayKey === today ? state.activeDayCount : 0
  const dayCount = carried + Math.max(0, Math.round(itemsPracticed))
  const tally: DailyTally = { activeDayKey: today, activeDayCount: dayCount }
  const goal = Math.max(1, Math.round(dailyGoal))

  const alreadyActive = state.trainingDays.includes(today)
  const advancing = dayCount >= goal && !alreadyActive
  const result = advancing ? recordTrainingDay(state, now) : null
  const streak: StreakState = result
    ? result.state
    : {
        streakCount: state.streakCount,
        longestStreak: state.longestStreak,
        lastTrainingDate: state.lastTrainingDate,
        streakFreezes: state.streakFreezes,
        trainingDays: state.trainingDays,
      }

  return {
    streak,
    tally,
    state: { ...streak, ...tally },
    dayCount,
    dailyGoal: goal,
    becameActive: advancing,
    result,
  }
}

export function totalTrainingDays(trainingDays: string[]): number {
  return new Set(trainingDays).size
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface DayCell {
  key: string
  weekdayShort: string
  weekdayInitial: string
  isToday: boolean
  trained: boolean
  future: boolean
}

function makeDayCell(ms: number, trained: Set<string>, todayKey: string): DayCell {
  const key = dayKey(ms)
  const weekday = WEEKDAYS[new Date(ms).getUTCDay()] ?? 'Sun'
  return {
    key,
    weekdayShort: weekday,
    weekdayInitial: weekday.charAt(0),
    isToday: key === todayKey,
    future: key > todayKey,
    trained: trained.has(key) && key <= todayKey,
  }
}

export function buildDayCells(
  trainingDays: readonly string[],
  count: number,
  now: number,
): DayCell[] {
  const trained = new Set(trainingDays)
  const todayKey = dayKey(now)
  const cells: DayCell[] = []
  for (let i = count - 1; i >= 0; i--) {
    cells.push(makeDayCell(now - i * DAY_MS, trained, todayKey))
  }
  return cells
}
