/**
 * Training-streak rules. Days are `YYYY-MM-DD` UTC keys so everything lives in
 * one day-space (no off-by-one drift). Pure: callers pass the current state and
 * `now` (epoch ms); the result carries the next state plus flags a feature can
 * turn into notifications. Notifications themselves are out of the domain.
 */
export interface StreakState {
  streakCount: number
  /** Longest streak ever reached; never decreases. */
  longestStreak: number
  lastTrainingDate: string | null
  /** Freezes in reserve; one is spent to forgive a single missed day. */
  streakFreezes: number
  trainingDays: string[]
}

export interface StreakResult {
  state: StreakState
  /** Today was already recorded; nothing changed. */
  alreadyTrainedToday: boolean
  /** The streak carried over (consecutive day or a freeze rescue). */
  continued: boolean
  /** A freeze was spent to forgive a single missed day. */
  usedFreeze: boolean
  /** The streak reached a 7-day milestone. */
  isMilestone: boolean
  /** The streak advanced past its previous count. */
  isNewStreak: boolean
}

const MAX_STREAK_FREEZES = 2
const HISTORY_DAYS = 365
const MILESTONE_INTERVAL = 7
const DAY_MS = 86_400_000

/** The `YYYY-MM-DD` UTC day key for an instant. */
export function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

function shiftDayKey(key: string, daysBack: number): string {
  const date = new Date(`${key}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - daysBack)
  return date.toISOString().slice(0, 10)
}

/** Record today as trained and advance/break/freeze the streak accordingly. */
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
  // Exactly one missed day, with a freeze in reserve, keeps the chain alive.
  const usedFreeze = !isConsecutive && state.lastTrainingDate === dayBefore && state.streakFreezes > 0
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

/** Total distinct days trained. */
export function totalTrainingDays(trainingDays: string[]): number {
  return new Set(trainingDays).size
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface DayCell {
  /** `YYYY-MM-DD` UTC key. */
  key: string
  weekdayShort: string
  /** Single letter for a dense calendar header (S M T W T F S). */
  weekdayInitial: string
  isToday: boolean
  trained: boolean
  /** A day later than today; rendered as a faint placeholder, never "missed". */
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

/** The last `count` UTC days ending today, oldest first — the week strip for the
 * streak view. Pure: `now` (epoch ms) is injected. */
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
