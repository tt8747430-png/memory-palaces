# Daily-Goal Streak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A day counts toward the streak (becomes an **active day**) only when the learner reaches a configurable **daily goal** of practiced items (default 5); below the goal does not count. Remove the home's `TodayTrainingCard`/`UpNextCard` and surface the streak + goal ring in the header, with global review on the Streak page.

**Architecture:** A new pure `recordPractice(state, items, goal, now)` in `shared/lib/streak.ts` accumulates a per-UTC-day tally on `Progress` (`activeDayKey`/`activeDayCount`) and, the moment the tally reaches the goal, advances the streak via the existing `recordTrainingDay`. `completeSession` threads an `itemsPracticed` count and the goal (the goal is injected by `useSessionReward` from `Preferences.dailyGoal`). Every practice mode reports its item count. Decision recorded in [docs/adr/0002-streak-requires-daily-goal.md](../../adr/0002-streak-requires-daily-goal.md).

**Tech Stack:** React 19, TypeScript (strict), Zustand, RxDB (Dexie) with versioned schemas + migrations, Vitest + RTL, i18next.

**Depends on:** none (independent of Plan 1, but normally sequenced after it).

## Global Constraints

- **Strict TS:** no `any`; `noUnusedLocals` + `noUnusedParameters` ON.
- **Domain language (CONTEXT.md):** the streak unit is an **active day** (not "training day"); the gate is the **daily goal**; "all practice counts" — graded card, quiz/test answer, match pair, memorized verse each = 1 item.
- **i18n:** all new copy via i18next keys in `src/shared/i18n/locales/en.ts`.
- **Pure domain:** `shared/lib/streak.ts` stays pure; `now` injected.
- **RxDB:** any change to a persisted shape requires a schema `version` bump **and** a migration strategy; the shared `runRepositoryContract` and `fake-indexeddb` tests must stay green.
- **Tests:** Vitest `globals: false` — import from `vitest`.
- **Field names kept:** retain `Progress.trainingDays` / `lastTrainingDate` as the storage field names (they now hold *active* days) to avoid a rename migration across the calendar/transfer/notification code. Only the two tally fields are added.
- **Commands:** `npm run typecheck`, `npm run test`, `npm run lint`, single file `npx vitest run <path>`.

## File Structure

| File | Change |
|------|--------|
| `src/shared/config/constants.ts` | Add `DEFAULT_DAILY_GOAL`, `DAILY_GOAL_OPTIONS` |
| `src/entities/preferences/model/types.ts` | Add `dailyGoal` to interface/input/defaults/changes |
| `src/entities/preferences/model/types.test.ts` | Cover `dailyGoal` default |
| `src/entities/progress/model/types.ts` | Add `activeDayKey`/`activeDayCount` |
| `src/entities/progress/model/types.test.ts` | Cover new defaults |
| `src/app/persistence/schemas.ts` | Bump `progressSchema` v0→1, `preferencesSchema` v2→3; add props |
| `src/app/persistence/migrations.ts` | Add `migrateProgressV1`, `migratePreferencesV3`; widen V0/V1 omits |
| `src/app/persistence/database.ts` | Wire the two new migration strategies |
| `src/app/persistence/migrations.test.ts` | Cover the two migrations |
| `src/shared/lib/streak.ts` | Add `DailyTally`, `PracticeOutcome`, `recordPractice` |
| `src/shared/lib/streak.test.ts` | Cover `recordPractice` |
| `src/features/progress/rewards.ts` | Add `XP_VERSE` |
| `src/features/progress/complete-session.ts` | `itemsPracticed`+`dailyGoal`; drop `recordDay`/`alreadyTrainedToday`; add `dayBecameActive`/`dayCount` |
| `src/features/progress/complete-session.test.ts` | Rewrite for the new contract |
| `src/features/progress/index.ts` | Export `XP_VERSE` |
| `src/widgets/session-reward/use-session-reward.ts` | Inject `dailyGoal`; "day complete" toast |
| `src/pages/review/ui/ReviewPage.tsx` `:119` | `itemsPracticed: summary.graded` |
| `src/pages/room-train/ui/RoomTrainPage.tsx` `:127` | `itemsPracticed: summary.graded` |
| `src/pages/room-quiz/ui/RoomQuizPage.tsx` `:91-94` | `itemsPracticed: result.total`, drop `recordDay` |
| `src/pages/quiz/ui/QuizPage.tsx` `:103-106` | `itemsPracticed: result.total`, drop `recordDay` |
| `src/pages/match/ui/MatchPage.tsx` `:82-84` | `itemsPracticed: loci.length` |
| `src/pages/verse/ui/VerseStudyPage.tsx` | Count a newly-memorized verse via `reward` |
| `src/widgets/home-header/ui/HomeHeader.tsx` | Add tappable streak/goal ring |
| `src/pages/palaces/ui/PalacesPage.tsx` | Remove the two cards; feed header ring; wire `onOpenStreak` |
| `src/pages/streak/ui/StreakPage.tsx` | Add "Review all due" CTA |
| `src/app/router.tsx` | Wire `onOpenStreak`; drop `onStartReview`/`onTrainRoom` from palaces; add `onReview` to streak |
| `src/widgets/today-training-card/**`, `src/widgets/up-next-card/**` | Delete |
| `src/shared/i18n/locales/en.ts` | New copy keys |

---

### Task 1: Add the daily-goal preference and the progress tally fields

**Files:**
- Modify: `src/shared/config/constants.ts`
- Modify: `src/entities/preferences/model/types.ts`
- Modify: `src/entities/preferences/model/types.test.ts`
- Modify: `src/entities/progress/model/types.ts`
- Modify: `src/entities/progress/model/types.test.ts`

**Interfaces:**
- Produces: `DEFAULT_DAILY_GOAL: number`, `DAILY_GOAL_OPTIONS: readonly number[]`; `Preferences.dailyGoal: number`; `Progress.activeDayKey: string | null`, `Progress.activeDayCount: number`.

- [ ] **Step 1: Add config constants**

Append to `src/shared/config/constants.ts`:

```ts
/** Items practiced in a day to make it "active" (advance the streak). */
export const DEFAULT_DAILY_GOAL = 5

/** Selectable daily-goal targets, shown in Settings. */
export const DAILY_GOAL_OPTIONS = [3, 5, 10, 20] as const
```

- [ ] **Step 2: Write the failing preference default test**

In `src/entities/preferences/model/types.test.ts`, add to the `makePreferences` describe:

```ts
  it('defaults the daily goal to 5', () => {
    expect(makePreferences({ id: 'p', createdAt: T0 }).dailyGoal).toBe(5)
  })
```

(If the file uses a different created-at constant than `T0`, match the existing one.)

- [ ] **Step 3: Run it (fails — `dailyGoal` not on the type)**

Run: `npx vitest run src/entities/preferences/model/types.test.ts`
Expected: FAIL.

- [ ] **Step 4: Add `dailyGoal` to Preferences**

In `src/entities/preferences/model/types.ts`:

Add the import at the top:

```ts
import { DEFAULT_DAILY_GOAL } from '@/shared/config'
```

In `interface Preferences`, after `language: string`, add:

```ts
  /** Items to practise per day to keep the streak (the daily goal). */
  dailyGoal: number
```

In `DEFAULT_PREFERENCES`, after `language: 'en',` add:

```ts
  dailyGoal: DEFAULT_DAILY_GOAL,
```

In `MakePreferencesInput`, after `language?: string`, add:

```ts
  dailyGoal?: number
```

In `makePreferences`, after the `language:` line, add:

```ts
    dailyGoal: input.dailyGoal ?? DEFAULT_PREFERENCES.dailyGoal,
```

In the `PreferencesChanges` `Pick<…>` union, add `| 'dailyGoal'`.

- [ ] **Step 5: Run it (passes)**

Run: `npx vitest run src/entities/preferences/model/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Add the progress tally fields (test first)**

In `src/entities/progress/model/types.test.ts`, the first `makeProgress` test asserts the full object via `toEqual`. Add the two new fields to that expected object:

```ts
      activeDayKey: null,
      activeDayCount: 0,
```

(Place them alongside the other defaults inside the `toEqual({ … })`.)

- [ ] **Step 7: Run it (fails)**

Run: `npx vitest run src/entities/progress/model/types.test.ts`
Expected: FAIL (extra/missing keys).

- [ ] **Step 8: Add the fields to Progress**

In `src/entities/progress/model/types.ts`:

In `interface Progress`, after `trainingDays: string[]`, add:

```ts
  /** UTC day key the running practice tally belongs to; null before any practice. */
  activeDayKey: string | null
  /** Items practised during `activeDayKey` (resets when the day rolls over). */
  activeDayCount: number
```

In `MakeProgressInput`, after `trainingDays?: string[]`, add:

```ts
  activeDayKey?: string | null
  activeDayCount?: number
```

In `makeProgress`, after the `trainingDays:` line, add:

```ts
    activeDayKey: input.activeDayKey ?? null,
    activeDayCount: input.activeDayCount ?? 0,
```

- [ ] **Step 9: Run it (passes)**

Run: `npx vitest run src/entities/progress/model/types.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/shared/config/constants.ts src/entities/preferences/model src/entities/progress/model
git commit -m "feat: add dailyGoal preference and progress day-tally fields"
```

---

### Task 2: Persist the new fields (schema bumps + migrations)

**Files:**
- Modify: `src/app/persistence/schemas.ts`
- Modify: `src/app/persistence/migrations.ts`
- Modify: `src/app/persistence/database.ts`
- Modify: `src/app/persistence/migrations.test.ts`

**Interfaces:**
- Consumes: `Progress` / `Preferences` shapes from Task 1.
- Produces: `migrateProgressV1`, `migratePreferencesV3`.

- [ ] **Step 1: Bump the schemas**

In `src/app/persistence/schemas.ts`, in `progressSchema` change `version: 0` to `version: 1`; in `properties` after `trainingDays: …` add:

```ts
    activeDayKey: { type: ['string', 'null'] },
    activeDayCount: { type: 'number' },
```

and in `required` add `'activeDayKey'` and `'activeDayCount'`.

In `preferencesSchema` change `version: 2` to `version: 3`; in `properties` after `language: { type: 'string' }` add:

```ts
    dailyGoal: { type: 'number' },
```

and in `required` add `'dailyGoal'`.

- [ ] **Step 2: Add the migrations**

In `src/app/persistence/migrations.ts`:

Add a Progress import at the top: `import type { Progress } from '@/entities/progress'`.

Append:

```ts
/** The v0 progress shape — before the per-day practice tally was added. */
export type ProgressV0 = Omit<Progress, 'activeDayKey' | 'activeDayCount'>

/** v0 → v1: backfill an empty tally; existing streak history is untouched. */
export function migrateProgressV1(oldDoc: ProgressV0): Progress {
  return { ...oldDoc, activeDayKey: null, activeDayCount: 0 }
}

/** The v2 preferences shape — before the daily goal was added. */
export type PreferencesV2 = Omit<Preferences, 'dailyGoal'>

/** v2 → v3: backfill the default daily goal; stored fields win. */
export function migratePreferencesV3(oldDoc: PreferencesV2): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}
```

Then widen the earlier preference omits so each version is honest about not having `dailyGoal`: change `PreferencesV0` to `Omit<Preferences, 'darkMode' | 'language' | 'privacy' | 'palacesView' | 'palacesSort' | 'dailyGoal'>` and `PreferencesV1` to `Omit<Preferences, 'palacesView' | 'palacesSort' | 'dailyGoal'>`.

- [ ] **Step 3: Wire the strategies**

In `src/app/persistence/database.ts`:

- Change the `progress` line to: `progress: { schema: progressSchema, migrationStrategies: { 1: migrateProgressV1 } },`
- Change the preferences `migrationStrategies` to: `{ 1: migratePreferencesV1, 2: migratePreferencesV2, 3: migratePreferencesV3 }`.
- Add `migrateProgressV1` and `migratePreferencesV3` to the import from `./migrations`.

- [ ] **Step 4: Test the migrations**

In `src/app/persistence/migrations.test.ts`, add (mirroring the existing migration tests' style):

```ts
  it('migrateProgressV1 backfills an empty day tally', () => {
    const v0 = {
      id: 'progress', createdAt: T0, updatedAt: T0, xp: 10,
      streakCount: 3, longestStreak: 3, lastTrainingDate: '2026-01-09',
      streakFreezes: 0, bestQuizAccuracy: 0, trainingDays: ['2026-01-09'],
    }
    const v1 = migrateProgressV1(v0)
    expect(v1.activeDayKey).toBeNull()
    expect(v1.activeDayCount).toBe(0)
    expect(v1.streakCount).toBe(3)
  })

  it('migratePreferencesV3 backfills the default daily goal', () => {
    const v2 = { ...DEFAULT_PREFERENCES } as PreferencesV2
    delete (v2 as Partial<typeof DEFAULT_PREFERENCES>).dailyGoal
    expect(migratePreferencesV3(v2).dailyGoal).toBe(5)
  })
```

Add the needed imports (`migrateProgressV1`, `migratePreferencesV3`, `type PreferencesV2`, `DEFAULT_PREFERENCES`) and reuse the file's existing `T0` constant (define one if absent: `const T0 = new Date(0).toISOString()`).

- [ ] **Step 5: Run and commit**

Run: `npx vitest run src/app/persistence/migrations.test.ts`
Expected: PASS.

```bash
git add src/app/persistence
git commit -m "feat: persist daily-goal and day-tally via schema migrations"
```

---

### Task 3: `recordPractice` — the active-day rule

**Files:**
- Modify: `src/shared/lib/streak.ts`
- Modify: `src/shared/lib/streak.test.ts`

**Interfaces:**
- Consumes: existing `StreakState`, `recordTrainingDay`, `StreakResult`, `dayKey`.
- Produces: `interface DailyTally { activeDayKey: string | null; activeDayCount: number }`; `interface PracticeOutcome`; `recordPractice(state: StreakState & DailyTally, itemsPracticed: number, dailyGoal: number, now: number): PracticeOutcome`.

- [ ] **Step 1: Write the failing tests**

Append to `src/shared/lib/streak.test.ts` (extend the import to add `recordPractice`, `type DailyTally`):

```ts
describe('recordPractice', () => {
  const base: StreakState & DailyTally = { ...empty, activeDayKey: null, activeDayCount: 0 }

  it('accumulates below the goal without advancing the streak', () => {
    const out = recordPractice(base, 3, 5, NOW)
    expect(out.dayCount).toBe(3)
    expect(out.becameActive).toBe(false)
    expect(out.streak.streakCount).toBe(0)
    expect(out.streak.trainingDays).toEqual([])
    expect(out.tally).toEqual({ activeDayKey: '2026-01-10', activeDayCount: 3 })
  })

  it('marks the day active and advances the streak when the goal is reached', () => {
    const partial: StreakState & DailyTally = { ...base, activeDayKey: '2026-01-10', activeDayCount: 4 }
    const out = recordPractice(partial, 1, 5, NOW)
    expect(out.dayCount).toBe(5)
    expect(out.becameActive).toBe(true)
    expect(out.streak.streakCount).toBe(1)
    expect(out.streak.trainingDays).toEqual(['2026-01-10'])
  })

  it('resets the tally when the day rolls over', () => {
    const yesterday: StreakState & DailyTally = { ...base, activeDayKey: '2026-01-09', activeDayCount: 9 }
    const out = recordPractice(yesterday, 2, 5, NOW)
    expect(out.dayCount).toBe(2)
    expect(out.becameActive).toBe(false)
  })

  it('only advances once per day (further practice just bumps the tally)', () => {
    const active: StreakState & DailyTally = {
      ...base, streakCount: 1, lastTrainingDate: '2026-01-10',
      trainingDays: ['2026-01-10'], activeDayKey: '2026-01-10', activeDayCount: 5,
    }
    const out = recordPractice(active, 3, 5, NOW)
    expect(out.dayCount).toBe(8)
    expect(out.becameActive).toBe(false)
    expect(out.streak.streakCount).toBe(1)
  })
})
```

- [ ] **Step 2: Run it (fails — `recordPractice` undefined)**

Run: `npx vitest run src/shared/lib/streak.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `recordPractice`**

In `src/shared/lib/streak.ts`, after `recordTrainingDay`, add:

```ts
/** The per-day practice tally that rides alongside the streak fields. */
export interface DailyTally {
  /** UTC day key the running count belongs to; null before any practice. */
  activeDayKey: string | null
  /** Items practised during `activeDayKey`. */
  activeDayCount: number
}

export interface PracticeOutcome {
  /** Streak fields after this practice (advanced only when the goal is first met today). */
  streak: StreakState
  /** The tally after this practice. */
  tally: DailyTally
  /** Items practised today after adding this batch. */
  dayCount: number
  /** The goal in force. */
  dailyGoal: number
  /** True only on the batch that pushed today from inactive to active. */
  becameActive: boolean
  /** Streak flags from the advance, when the day became active; else null. */
  result: StreakResult | null
}

/** Add practised items to today's tally and, the moment the tally reaches the daily
 * goal, mark the day active and advance the streak. Items below the goal accumulate
 * but never advance the streak. Pure: `now` injected. */
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
  if (dayCount >= goal && !alreadyActive) {
    const result = recordTrainingDay(state, now)
    return { streak: result.state, tally, dayCount, dailyGoal: goal, becameActive: true, result }
  }

  return {
    streak: {
      streakCount: state.streakCount,
      longestStreak: state.longestStreak,
      lastTrainingDate: state.lastTrainingDate,
      streakFreezes: state.streakFreezes,
      trainingDays: state.trainingDays,
    },
    tally,
    dayCount,
    dailyGoal: goal,
    becameActive: false,
    result: null,
  }
}
```

- [ ] **Step 4: Run it (passes) and commit**

Run: `npx vitest run src/shared/lib/streak.test.ts`
Expected: PASS (new block + the unchanged `recordTrainingDay` suite).

```bash
git add src/shared/lib/streak.ts src/shared/lib/streak.test.ts
git commit -m "feat: recordPractice gates the active day on a daily goal"
```

---

### Task 4: `completeSession` threads items + goal

**Files:**
- Modify: `src/features/progress/rewards.ts`
- Modify: `src/features/progress/complete-session.ts`
- Modify: `src/features/progress/complete-session.test.ts`
- Modify: `src/features/progress/index.ts`

**Interfaces:**
- Consumes: `recordPractice` (Task 3).
- Produces: `CompleteSessionOptions { xp: number; itemsPracticed: number; dailyGoal: number; quizAccuracy?: number }`; `SessionReward { …; dayBecameActive: boolean; dayCount: number; dailyGoal: number }` (no more `alreadyTrainedToday`/`recordDay`); `XP_VERSE: number`.

- [ ] **Step 1: Add `XP_VERSE`**

In `src/features/progress/rewards.ts`, after `XP_MATCH`, add:

```ts
/** XP for memorising a single verse (bible mode). */
export const XP_VERSE = 20
```

In `src/features/progress/index.ts`, add `XP_VERSE` to the `from './rewards'` export list.

- [ ] **Step 2: Rewrite the complete-session tests**

Replace the body of `describe('completeSession', …)` in `src/features/progress/complete-session.test.ts` with:

```ts
describe('completeSession', () => {
  it('awards XP and accumulates the day tally without a streak below goal', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 100, itemsPracticed: 3, dailyGoal: 5 }, NOW)
    expect(reward.xpGained).toBe(100)
    expect(reward.dayCount).toBe(3)
    expect(reward.dayBecameActive).toBe(false)
    expect(reward.streakCount).toBe(0)
    expect(store.getState().progress?.xp).toBe(100)
    expect(store.getState().progress?.activeDayCount).toBe(3)
    expect(store.getState().progress?.trainingDays).toEqual([])
  })

  it('starts the streak when the goal is reached', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 50, itemsPracticed: 5, dailyGoal: 5 }, NOW)
    expect(reward.dayBecameActive).toBe(true)
    expect(reward.streakCount).toBe(1)
    expect(store.getState().progress?.trainingDays).toContain('2026-01-10')
  })

  it('accumulates across sessions and crosses the goal on the second', async () => {
    const store = startedStore()
    await completeSession(store, { xp: 10, itemsPracticed: 3, dailyGoal: 5 }, NOW)
    const reward = await completeSession(store, { xp: 10, itemsPracticed: 2, dailyGoal: 5 }, NOW)
    expect(reward.dayCount).toBe(5)
    expect(reward.dayBecameActive).toBe(true)
    expect(reward.streakCount).toBe(1)
  })

  it('reports a level-up when XP crosses a threshold', async () => {
    const store = startedStore()
    await completeSession(store, { xp: 240, itemsPracticed: 5, dailyGoal: 5 }, NOW)
    const reward = await completeSession(store, { xp: 20, itemsPracticed: 1, dailyGoal: 5 }, NOW)
    expect(reward.leveledUp).toBe(true)
    expect(reward.level).toBe(2)
  })

  it('records the best quiz accuracy when provided', async () => {
    const store = startedStore()
    const reward = await completeSession(store, { xp: 40, itemsPracticed: 4, dailyGoal: 5, quizAccuracy: 75 }, NOW)
    expect(reward.isBestQuiz).toBe(true)
    expect(reward.quizAccuracy).toBe(75)
    expect(store.getState().progress?.bestQuizAccuracy).toBe(75)
  })

  it('flags a 7-day streak milestone', async () => {
    const target = Date.UTC(2026, 0, 7)
    const seed = makeProgress({
      id: 'progress', createdAt: new Date(0).toISOString(),
      streakCount: 6, longestStreak: 6,
      lastTrainingDate: dayKey(target - DAY), trainingDays: [dayKey(target - DAY)],
    })
    const store = startedStore([seed])
    const reward = await completeSession(store, { xp: 50, itemsPracticed: 5, dailyGoal: 5 }, target)
    expect(reward.streakCount).toBe(7)
    expect(reward.isMilestone).toBe(true)
  })
})
```

(The `reward helpers` describe block above it is unchanged.)

- [ ] **Step 3: Run it (fails)**

Run: `npx vitest run src/features/progress/complete-session.test.ts`
Expected: FAIL (old `recordDay`/`alreadyTrainedToday` contract).

- [ ] **Step 4: Rewrite `completeSession`**

Replace `src/features/progress/complete-session.ts` with:

```ts
import { levelFromXp, recordPractice } from '@/shared/lib'
import type { Progress, ProgressStore } from '@/entities/progress'
import { currentProgress } from './current-progress'

export interface CompleteSessionOptions {
  /** XP earned this session (already computed via the reward helpers). */
  xp: number
  /** Items practised this session, counted toward the daily goal. */
  itemsPracticed: number
  /** The learner's daily goal (items to make the day active). */
  dailyGoal: number
  /** When set, also record the session's quiz accuracy (best-of). */
  quizAccuracy?: number
}

export interface SessionReward {
  xpGained: number
  leveledUp: boolean
  level: number
  streakCount: number
  isMilestone: boolean
  /** True only when this session pushed today's tally to the goal (day just became active). */
  dayBecameActive: boolean
  /** Items practised today after this session. */
  dayCount: number
  /** The daily goal in force. */
  dailyGoal: number
  /** A quiz this session set a new personal-best accuracy. */
  isBestQuiz: boolean
  /** The session's quiz accuracy (rounded), when one was played. */
  quizAccuracy?: number
}

/**
 * Facade — apply everything a finished session earns in a SINGLE read-modify-write:
 * XP, the practice tally / active-day streak, and (optionally) the best quiz accuracy.
 * XP is always awarded; the streak advances only when the day's tally reaches the goal.
 */
export async function completeSession(
  store: ProgressStore,
  options: CompleteSessionOptions,
  now: number = Date.now(),
): Promise<SessionReward> {
  const base = currentProgress(store, now)
  const beforeLevel = levelFromXp(base.xp).level
  const gained = Math.max(0, Math.round(options.xp))

  const practice = recordPractice(base, options.itemsPracticed, options.dailyGoal, now)

  let next: Progress = {
    ...base,
    ...practice.streak,
    activeDayKey: practice.tally.activeDayKey,
    activeDayCount: practice.tally.activeDayCount,
    xp: base.xp + gained,
    updatedAt: new Date(now).toISOString(),
  }

  const quizAccuracy =
    options.quizAccuracy === undefined ? undefined : Math.round(options.quizAccuracy)
  const isBestQuiz = quizAccuracy !== undefined && quizAccuracy > base.bestQuizAccuracy
  if (quizAccuracy !== undefined) {
    next = { ...next, bestQuizAccuracy: Math.max(next.bestQuizAccuracy, quizAccuracy) }
  }

  await store.getState().save(next)

  const level = levelFromXp(next.xp).level
  return {
    xpGained: gained,
    leveledUp: level > beforeLevel,
    level,
    streakCount: practice.streak.streakCount,
    isMilestone: practice.result?.isMilestone ?? false,
    dayBecameActive: practice.becameActive,
    dayCount: practice.dayCount,
    dailyGoal: practice.dailyGoal,
    isBestQuiz,
    quizAccuracy,
  }
}
```

- [ ] **Step 5: Run it (passes) and commit**

Run: `npx vitest run src/features/progress/complete-session.test.ts`
Expected: PASS.

```bash
git add src/features/progress/rewards.ts src/features/progress/complete-session.ts src/features/progress/complete-session.test.ts src/features/progress/index.ts
git commit -m "feat: completeSession threads practice items and the daily goal"
```

---

### Task 5: Wire every practice mode to report items

**Files:**
- Modify: `src/widgets/session-reward/use-session-reward.ts`
- Modify: `src/pages/review/ui/ReviewPage.tsx:119`
- Modify: `src/pages/room-train/ui/RoomTrainPage.tsx:127`
- Modify: `src/pages/room-quiz/ui/RoomQuizPage.tsx:91-94`
- Modify: `src/pages/quiz/ui/QuizPage.tsx:103-106`
- Modify: `src/pages/match/ui/MatchPage.tsx:82-84`
- Modify: `src/pages/verse/ui/VerseStudyPage.tsx`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Consumes: `CompleteSessionOptions` (Task 4).
- Produces: `useSessionReward()` returns `(options: Omit<CompleteSessionOptions, 'dailyGoal'>) => Promise<void>` — callers pass `xp`, `itemsPracticed`, optional `quizAccuracy`; the hook injects `dailyGoal` from preferences.

- [ ] **Step 1: Inject the goal and celebrate an active day**

In `src/widgets/session-reward/use-session-reward.ts`:

- Add the import: `import { DEFAULT_DAILY_GOAL } from '@/shared/config'`.
- Change the return type and call:

```ts
export function useSessionReward(): (
  options: Omit<CompleteSessionOptions, 'dailyGoal'>,
) => Promise<void> {
```

```ts
    async (options: Omit<CompleteSessionOptions, 'dailyGoal'>) => {
      if (!store) return
      const dailyGoal = preferencesStore?.getState().preferences?.dailyGoal ?? DEFAULT_DAILY_GOAL
      const reward = await completeSession(store, { ...options, dailyGoal })
```

- After the existing milestone toasts, add (inside the `notify` block):

```ts
      if (reward.dayBecameActive) toast.success(t('reward.dayComplete', { count: reward.dailyGoal }))
```

- [ ] **Step 2: Card sessions report graded count**

In `src/pages/review/ui/ReviewPage.tsx` line 119, change to:

```ts
        void reward({ xp: studyXp(summary.graded), itemsPracticed: summary.graded })
```

In `src/pages/room-train/ui/RoomTrainPage.tsx` line 127, change to:

```ts
        void reward({ xp: studyXp(summary.graded), itemsPracticed: summary.graded })
```

- [ ] **Step 3: Quiz sessions report answered count, drop the accuracy gate**

In `src/pages/room-quiz/ui/RoomQuizPage.tsx`, replace the `reward({ … })` (lines 91-94) with:

```ts
    void reward({
      xp: quizXp(result.score),
      quizAccuracy: result.accuracy,
      itemsPracticed: result.total,
    })
```

In `src/pages/quiz/ui/QuizPage.tsx`, replace the `reward({ … })` (lines 103-106) with:

```ts
    void reward({
      xp: quizXp(result.score),
      quizAccuracy: result.accuracy,
      itemsPracticed: result.total,
    })
```

(`result.total` is the number of questions answered — every answer counts now, regardless of accuracy.)

- [ ] **Step 4: Match reports pairs solved**

In `src/pages/match/ui/MatchPage.tsx`, change the `onComplete` (lines 82-84) to:

```ts
      onComplete={() => {
        void reward({ xp: XP_MATCH, itemsPracticed: loci.length })
```

(`loci` is the match's card set — one item per solved pair.)

- [ ] **Step 5: A newly-memorized verse counts**

In `src/pages/verse/ui/VerseStudyPage.tsx`:

- Add imports: `import { useSessionReward } from '@/widgets/session-reward'` and add `XP_VERSE` to the existing `@/features/progress` import.
- Inside the component, add: `const reward = useSessionReward()`.
- Change `handleToggleMemorized` so only the transition *into* memorized counts:

```ts
  const handleToggleMemorized = (id: string) => {
    const locus = locusStore.getState().loci.find((candidate) => candidate.id === id)
    if (!locus) return
    const nowMemorized = !locus.memorized
    void editLocus(locusStore, id, { memorized: nowMemorized })
    if (nowMemorized) void reward({ xp: XP_VERSE, itemsPracticed: 1 })
  }
```

- [ ] **Step 6: Add copy**

In `src/shared/i18n/locales/en.ts`, in the `reward` section add:

```ts
    dayComplete: "Day complete — {{count}} done! You're active today 🔥",
```

- [ ] **Step 7: Typecheck, test the touched specs, commit**

Run: `npm run typecheck`
Expected: PASS.

Run: `npx vitest run src/pages/room-quiz src/pages/quiz src/pages/match src/pages/verse src/pages/review src/pages/room-train`
Expected: PASS (update any assertion still passing the old `recordDay`/missing `itemsPracticed` shape).

```bash
git add src/widgets/session-reward src/pages/review src/pages/room-train src/pages/room-quiz src/pages/quiz src/pages/match src/pages/verse src/shared/i18n/locales/en.ts
git commit -m "feat: every practice mode reports items toward the daily goal"
```

---

### Task 6: Header streak ring; remove the home cards

**Files:**
- Modify: `src/widgets/home-header/ui/HomeHeader.tsx`
- Modify: `src/pages/palaces/ui/PalacesPage.tsx`
- Delete: `src/widgets/today-training-card/**`, `src/widgets/up-next-card/**`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces: `HomeHeader` gains `streak?: { count: number; dayCount: number; dailyGoal: number }` and `onOpenStreak?: () => void`.

- [ ] **Step 1: Add the streak ring to the header**

In `src/widgets/home-header/ui/HomeHeader.tsx`:

- Add `Flame` to the `lucide-react` import.
- Extend `HomeHeaderProps` with:

```ts
  /** Live streak count + today's progress toward the goal; omit to hide the ring. */
  streak?: { count: number; dayCount: number; dailyGoal: number }
  onOpenStreak?: () => void
```

- Destructure `streak` and `onOpenStreak` in the component params.
- In the right-cluster `<div className="flex shrink-0 items-center gap-1">` (before the search button), add:

```tsx
        {streak && onOpenStreak ? (
          <button
            type="button"
            onClick={onOpenStreak}
            aria-label={t('home.streakAria', { count: streak.count, done: streak.dayCount, goal: streak.dailyGoal })}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest transition-transform active:scale-95"
          >
            <Flame
              className={cn('size-4', streak.dayCount >= streak.dailyGoal ? 'text-[var(--warning)]' : 'text-muted-foreground')}
              fill={streak.dayCount >= streak.dailyGoal ? 'currentColor' : 'none'}
              aria-hidden
            />
            <span className="tabular-nums">{streak.count}</span>
            <span className="text-[length:var(--p-text-tiny)] tabular-nums text-muted-foreground">
              {streak.dayCount}/{streak.dailyGoal}
            </span>
          </button>
        ) : null}
```

- Add `cn` to the `@/shared/ui`/`@/shared/lib` import (it already imports from `@/shared/lib` — add `cn` there: `import { levelFromXp, cn, type StickyHeader } from '@/shared/lib'`).

- [ ] **Step 2: Remove the two cards from the palaces page**

In `src/pages/palaces/ui/PalacesPage.tsx`:

- Delete the imports on lines 65-66 (`TodayTrainingCard`, `UpNextCard`/`pickUpNextRooms`).
- Delete `dueCount` (line 212) and `upNext` (line 213) and `handleStartTraining` (lines 218-221).
- Delete the whole `active.length > 0 ? ( … ) : null` block that renders `<TodayTrainingCard …>` and `<UpNextCard …>` (lines ~506-522).
- Keep `dueCounts` (countDuePerPalace) — it still feeds per-palace badges.
- Pass the ring to the header: add to the `<HomeHeader … />` props:

```tsx
          streak={{
            count: progress?.streakCount ?? 0,
            dayCount: progress?.activeDayCount ?? 0,
            dailyGoal: prefs.dailyGoal,
          }}
          onOpenStreak={() => onOpenStreak?.()}
```

- Add `onOpenStreak?: () => void` to `PalacesPageProps`, destructure it, and remove the now-unused `onStartReview` and `onStartTraining`/`onTrainRoom` props **only if** they are no longer referenced anywhere else in the file (search first; `onTrainRoom` was used solely by `UpNextCard`). Remove unused ones from the interface and destructuring to satisfy `no-unused-vars`.

- [ ] **Step 3: Delete the dead widgets**

```bash
git rm -r src/widgets/today-training-card src/widgets/up-next-card
```

- [ ] **Step 4: Add header copy**

In `src/shared/i18n/locales/en.ts` `home` section add:

```ts
    streakAria: '{{count}}-day streak — {{done}} of {{goal}} practised today. Open streak.',
```

- [ ] **Step 5: Typecheck, test, commit**

Run: `npm run typecheck`
Expected: PASS — if it flags removed props still referenced in `src/app/router.tsx`, that is fixed in Task 7; otherwise temporarily leave the router props until Task 7 and run `npx vitest run src/pages/palaces src/widgets/home-header` for now.

```bash
git add -A
git commit -m "feat: header streak ring replaces the home training/up-next cards"
```

---

### Task 7: Streak-page review entry + router wiring

**Files:**
- Modify: `src/pages/streak/ui/StreakPage.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces: `StreakPage` gains `onReview?: () => void`; the palaces route passes `onOpenStreak`; the streak route passes `onReview` → `/review`.

- [ ] **Step 1: Add the "Review all due" CTA**

In `src/pages/streak/ui/StreakPage.tsx`:

- Add `onReview?: () => void` to `StreakPageProps` and destructure it.
- Import `Button` from `@/shared/ui` and an icon (`ArrowRight` from `lucide-react`) if not present.
- Near the top of the page body (above `<StreakCalendar … />`), add:

```tsx
        {onReview ? (
          <Button className="w-full" onClick={onReview}>
            {t('streak.reviewDue')}
            <ArrowRight className="size-[18px]" aria-hidden />
          </Button>
        ) : null}
```

- [ ] **Step 2: Wire the routes**

In `src/app/router.tsx`:

- On the palaces route element, add `onOpenStreak={() => navigate({ to: routes.streak })}` (match the file's existing navigation idiom) and remove the `onStartReview` / `onTrainRoom` / `onStartTraining` props that Task 6 deleted from `PalacesPageProps`.
- On the streak route element, add `onReview={() => navigate({ to: routes.review })}`.

(Use the exact `navigate`/`routes` helpers already used by neighbouring routes in the file.)

- [ ] **Step 3: Add copy**

In `src/shared/i18n/locales/en.ts` `streak` section add:

```ts
    reviewDue: 'Review all cards due',
```

- [ ] **Step 4: Full typecheck + suite + lint**

Run: `npm run typecheck && npm run test && npm run lint`
Expected: PASS. Fix any remaining references to deleted props/widgets or the old `recordDay`/`alreadyTrainedToday` fields surfaced by the full suite (e.g. `progress-commands.test.ts`, `transfer-progress.test.ts`, `NotificationBridge.test.tsx`) by giving them the new `itemsPracticed`/`dailyGoal` shape and tally fields.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: streak page hosts global review; wire routes"
```

---

### Task 8: Full verification

- [ ] **Step 1:** Run `npm run typecheck` → PASS.
- [ ] **Step 2:** Run `npm run test` → PASS (whole suite).
- [ ] **Step 3:** Run `npm run lint` → PASS.
- [ ] **Step 4:** Manual smoke (optional): `npm run dev`, practise below the goal → header ring fills but flame stays grey and the streak does not advance; reach the goal → flame lights, "Day complete" toast, streak +1.
- [ ] **Step 5:** Commit any fixups.

```bash
git add -A
git commit -m "test: align progress/notification specs with the active-day rule"
```

---

## Self-Review

**Spec coverage (ADR-0002):**
- Active day = reach the daily goal; below goal does not count → Tasks 3–4 (`recordPractice`, `completeSession`).
- Daily goal is a preference (default 5) → Tasks 1–2; editable in Settings is handled in **Plan 3** (the Settings control ships with the study-overview UI work) — noted there.
- All practice counts (card/quiz/match/verse) → Task 5.
- Per-day tally on `Progress`, migration-safe → Tasks 1–2.
- Streak surfaced in the header; global review relocates to the Streak page → Tasks 6–7.

**Placeholder scan:** every code step is concrete. UI edits cite exact `file:line` and give the literal replacement text; the two spots that defer to existing idioms (router `navigate`, `SettingsRow`) name the exact helper/component to mirror. ✓

**Type consistency:** `CompleteSessionOptions` (xp, itemsPracticed, dailyGoal, quizAccuracy?) defined in Task 4 is consumed in Task 5 as `Omit<…, 'dailyGoal'>`; `recordPractice`'s `PracticeOutcome` fields (`streak`, `tally`, `dayCount`, `becameActive`, `result`) defined in Task 3 are read in Task 4. `Progress.activeDayKey/activeDayCount` and `Preferences.dailyGoal` defined in Task 1 are persisted in Task 2 and read in Tasks 4–6. ✓

**Note — Settings control:** adding the `dailyGoal` picker to the Settings screen is bundled into **Plan 3, Task 1** (it touches the same Settings surface as other UI work). Until then the goal stays at the default 5; nothing in this plan depends on the control existing.
