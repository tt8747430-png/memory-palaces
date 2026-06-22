# SRS Maturity Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `srsStatus` report a card's **maturity** in three buckets (New → Learning → Known) and stop treating "due" as a status — "due" becomes purely the *cards-for-today* queue, computed via `isDue`.

**Architecture:** `srsStatus` is a pure `shared/lib` function. Today it returns `new | due | learning | known`, where `due` is exclusive and *hides* a card's maturity (a matured card that comes due reports `due`). This plan narrows `SrsStatus` to `new | learning | known`, drops the `now` parameter (maturity is timeless), and updates every consumer to read due-ness through the existing `isDue(srs, now)` instead. This is the foundation the daily-goal streak (Plan 2) and the study-overview UI (Plan 3) build on. Decision recorded in [docs/adr/0003-srs-maturity-vs-due-queue.md](../../adr/0003-srs-maturity-vs-due-queue.md).

**Tech Stack:** React 19, TypeScript (strict), Vitest + React Testing Library, i18next, Tailwind v4, FSD layering.

## Global Constraints

- **Strict TS:** no `any`; `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` are ON — an unused variable or parameter is a compile error.
- **ESLint:** `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`.
- **Domain language (CONTEXT.md):** maturity buckets are **New / Learning / Known**. "Due" / "cards for today" is a *queue*, never a status. User-facing word for a locus is **card** (never "flashcard"); never say "deck".
- **i18n:** user-facing copy via i18next; status labels live at `srs.new` / `srs.learning` / `srs.known` in `src/shared/i18n/locales/en.ts`.
- **Pure domain:** `shared/lib` stays React/IO-free; the clock is injected (`now: number`), never read inline.
- **Tests:** Vitest with `globals: false` — import `describe`/`it`/`expect` from `vitest`. Colocate as `*.test.ts(x)`.
- **Commands:** `npm run typecheck` (`tsc --noEmit`), `npm run test` (`vitest run`), `npm run lint` (`eslint .`). Single test file: `npx vitest run <path>`.

> **Cross-cutting note:** narrowing the `SrsStatus` type breaks every consumer at once, so the **full** `npm run typecheck` is expected to stay red until Task 3 completes. Until then, each task is verified by running its own test file with `npx vitest run` (esbuild transpiles without a project-wide type check, so a single file's tests run green even while other files have type errors). Task 3 ends with a green full `typecheck`; Task 4 gates the whole suite.

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/shared/lib/srs.ts` | SRS scheduler + status | Narrow `SrsStatus`; `srsStatus` returns maturity, drops `now` |
| `src/shared/lib/srs.test.ts` | SRS unit tests | Rewrite the `srsStatus` describe to the maturity contract |
| `src/features/review/scope.ts` | Review-scope filters/counts | Drop `now` arg from `srsStatus` calls |
| `src/features/review/scope.test.ts` | Scope unit tests | `learning` now includes due-learning cards |
| `src/shared/ui/SrsStatusChip.tsx` | Per-card status badge | 3-key maps; show maturity; drop `now` prop |
| `src/widgets/up-next-card/lib/pick-up-next.ts` | Up-next room picker | Drop `now` arg from `srsStatus` call |
| `src/pages/room-hub/ui/RoomHubPage.tsx` | Room hub (`RoomProgress`) | 3-bucket status maps + tally |
| `src/pages/palace-detail/ui/PalaceDetailPage.tsx` | Palace detail summary | Count due via `isDue`, known via `srsStatus` |
| `src/features/locus/locus-commands.test.ts` | Locus command tests | Drop `now` arg + unused `const now` |
| `src/features/locus/reset-palace-srs.test.ts` | Reset-SRS test | Drop `now` arg + unused `const now` |

`src/shared/lib/index.ts` re-exports `srsStatus` and `SrsStatus` unchanged — no edit needed. `en.ts` keeps the `srs.due` key (now unreferenced, harmless); do not remove it in this plan.

---

### Task 1: `srsStatus` becomes a maturity function

**Files:**
- Modify: `src/shared/lib/srs.ts:24` (type) and `src/shared/lib/srs.ts:77-83` (function)
- Test: `src/shared/lib/srs.test.ts:76-100`

**Interfaces:**
- Produces: `type SrsStatus = 'new' | 'learning' | 'known'` and `srsStatus(srs: SrsState | undefined): SrsStatus`. Every later task consumes this 1-argument, 3-value signature.

- [ ] **Step 1: Rewrite the test to the maturity contract**

In `src/shared/lib/srs.test.ts`, replace the entire `describe('srsStatus', …)` block (lines 76-92) with:

```ts
describe('srsStatus (maturity)', () => {
  it('is "new" with no reps', () => {
    expect(srsStatus(undefined)).toBe('new')
  })

  it('reports maturity regardless of due date', () => {
    const card = schedule(undefined, 'good', NOW) // reps 1, interval 1
    expect(srsStatus(card)).toBe('learning')
    const pastDue: SrsState = { ...card, due: new Date(NOW - DAY_MS).toISOString() }
    expect(srsStatus(pastDue)).toBe('learning')
  })

  it('is "learning" below the mature interval and "known" at/above it', () => {
    const learning = schedule(undefined, 'good', NOW)
    expect(srsStatus(learning)).toBe('learning')
    const known: SrsState = { ...learning, interval: 21 }
    expect(srsStatus(known)).toBe('known')
  })
})
```

Then, in the `describe('markKnown', …)` block, change the last assertion from `expect(srsStatus(known, NOW)).toBe('known')` to:

```ts
    expect(srsStatus(known)).toBe('known')
```

- [ ] **Step 2: Run the test to verify it fails to type-resolve / fails**

Run: `npx vitest run src/shared/lib/srs.test.ts`
Expected: FAIL — `srsStatus` still takes `now`/returns `'due'`; the `pastDue` assertion is the meaningful red (old code returns `'due'` for a past-due card; new contract expects `'learning'`).

- [ ] **Step 3: Narrow the type and rewrite the function**

In `src/shared/lib/srs.ts`, change line 24 from:

```ts
export type SrsStatus = 'new' | 'due' | 'learning' | 'known'
```

to:

```ts
export type SrsStatus = 'new' | 'learning' | 'known'
```

Then replace the `srsStatus` function (lines 77-83):

```ts
/** Bucket a card's schedule into a coarse status for list badges. */
export function srsStatus(srs: SrsState | undefined, now: number): SrsStatus {
  if (!srs || srs.reps === 0) return 'new'
  if (isDue(srs, now)) return 'due'
  if (srs.interval >= MATURE_INTERVAL) return 'known'
  return 'learning'
}
```

with:

```ts
/** A card's maturity bucket, independent of whether it is due: New (never
 * successfully reviewed) → Learning (reviewed, interval still short) → Known
 * (interval matured). Due-ness is a separate, temporal concern — see `isDue`. */
export function srsStatus(srs: SrsState | undefined): SrsStatus {
  if (!srs || srs.reps === 0) return 'new'
  return srs.interval >= MATURE_INTERVAL ? 'known' : 'learning'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/shared/lib/srs.test.ts`
Expected: PASS (all three maturity cases + markKnown).

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/srs.ts src/shared/lib/srs.test.ts
git commit -m "refactor: srsStatus reports maturity, not due-ness"
```

---

### Task 2: Review scope reflects maturity

**Files:**
- Modify: `src/features/review/scope.ts:40,42,65,66`
- Test: `src/features/review/scope.test.ts:54-56,72`

**Interfaces:**
- Consumes: `srsStatus(srs)` (1-arg, from Task 1).
- Produces: `applyScope`/`scopeCounts` signatures unchanged (still take `now`, used by `isDue`); the `learning` scope now includes due cards that are still maturing.

- [ ] **Step 1: Update the scope tests to the new semantics**

In `src/features/review/scope.test.ts`, replace the `learning` case (lines 54-56):

```ts
  it('learning → reviewed but not yet mature, not due', () => {
    expect(applyScope(deck, { kind: 'learning' }, NOW).map((c) => c.id)).toEqual(['learning'])
  })
```

with:

```ts
  it('learning → reviewed but not yet mature, due or not', () => {
    expect(applyScope(deck, { kind: 'learning' }, NOW).map((c) => c.id)).toEqual(['due', 'learning'])
  })
```

Then change the `scopeCounts` expectation (line 72) from:

```ts
    expect(scopeCounts(deck, NOW)).toEqual({ all: 5, due: 2, new: 1, learning: 1, flagged: 1 })
```

to:

```ts
    expect(scopeCounts(deck, NOW)).toEqual({ all: 5, due: 2, new: 1, learning: 2, flagged: 1 })
```

(The `due` fixture has a short interval and reps > 0, so its maturity is now `learning`; it joins the real `learning` card. `due` stays 2 because `isDue` is unchanged: the new card + the past-due card.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/review/scope.test.ts`
Expected: FAIL — `scope.ts` still calls `srsStatus(locus.srs, now)`; the extra `now` arg is ignored at runtime so maturity already applies, but the assertions only match once the source is the intended 1-arg form. (If it already passes due to runtime arg-tolerance, proceed — Step 3 makes the source type-correct.)

- [ ] **Step 3: Drop the `now` argument from `srsStatus` calls**

In `src/features/review/scope.ts`, in `applyScope` change lines 40 and 42:

```ts
    case 'new':
      return loci.filter((locus) => srsStatus(locus.srs) === 'new')
    case 'learning':
      return loci.filter((locus) => srsStatus(locus.srs) === 'learning')
```

and in `scopeCounts` change lines 65-66:

```ts
    new: loci.filter((locus) => srsStatus(locus.srs) === 'new').length,
    learning: loci.filter((locus) => srsStatus(locus.srs) === 'learning').length,
```

(Leave the `isDue(locus.srs, now)` calls and the `now` parameters as they are — `now` is still used by the `due` branch.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/review/scope.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/review/scope.ts src/features/review/scope.test.ts
git commit -m "refactor: review scope counts maturity, not exclusive due"
```

---

### Task 3: Conform remaining consumers to the 3-bucket type

This task makes the whole project type-check again by updating every remaining `srsStatus` consumer. The changes are mechanical type narrowings; correctness is verified by `npm run typecheck` plus the two affected test files.

**Files:**
- Modify: `src/shared/ui/SrsStatusChip.tsx`
- Modify: `src/widgets/up-next-card/lib/pick-up-next.ts:59`
- Modify: `src/pages/room-hub/ui/RoomHubPage.tsx:240-265`
- Modify: `src/pages/palace-detail/ui/PalaceDetailPage.tsx:36,102-107`
- Test: `src/features/locus/locus-commands.test.ts:84-86,101-104`
- Test: `src/features/locus/reset-palace-srs.test.ts:35,40,43`

**Interfaces:**
- Consumes: `SrsStatus` (3 values) and `srsStatus(srs)` (1-arg) from Task 1; `isDue(srs, now)` from `shared/lib`.

- [ ] **Step 1: `SrsStatusChip` shows maturity**

Replace the whole of `src/shared/ui/SrsStatusChip.tsx` with:

```tsx
import { useTranslation } from 'react-i18next'
import { srsStatus, type SrsState, type SrsStatus } from '@/shared/lib'
import { cn } from '@/shared/lib'

/** Tone per maturity — each pre-checked to clear AA at small sizes. State is shown by
 * label + tone, never color alone. */
const TONE: Record<SrsStatus, string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  known: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
}

const LABEL: Record<SrsStatus, `srs.${SrsStatus}`> = {
  new: 'srs.new',
  learning: 'srs.learning',
  known: 'srs.known',
}

/** Badge for a card's maturity (new / learning / known), derived from its schedule
 * via `srsStatus`. Due-ness is shown by the study overview, not on this chip. */
export function SrsStatusChip({ srs }: { srs?: SrsState }) {
  const { t } = useTranslation()
  const status = srsStatus(srs)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-control px-2 py-0.5',
        'text-[length:var(--p-text-tiny)] font-semibold',
        TONE[status],
      )}
    >
      {t(LABEL[status])}
    </span>
  )
}
```

(Both callers — `loci-editor/ui/ContentRows.tsx:161` and `study-session/ui/StudyCardDeck.tsx:228` — render `<SrsStatusChip srs={locus.srs} />` with no `now` prop, so dropping it is safe.)

- [ ] **Step 2: `pick-up-next` drops the `now` arg**

In `src/widgets/up-next-card/lib/pick-up-next.ts`, change line 59 from:

```ts
    const known = roomLoci.filter((locus) => srsStatus(locus.srs, now) === 'known').length
```

to:

```ts
    const known = roomLoci.filter((locus) => srsStatus(locus.srs) === 'known').length
```

(`now` is still used by the `isDue(locus.srs, now)` call on the line above.)

- [ ] **Step 3: `RoomProgress` tallies three buckets**

In `src/pages/room-hub/ui/RoomHubPage.tsx`, change `STATUS_ORDER` (line 240) from:

```ts
const STATUS_ORDER: SrsStatus[] = ['known', 'learning', 'due', 'new']
```

to:

```ts
const STATUS_ORDER: SrsStatus[] = ['known', 'learning', 'new']
```

In `STATUS_FILL` (lines 241-246) remove the `due` entry so it reads:

```ts
const STATUS_FILL: Record<SrsStatus, string> = {
  known: 'bg-success',
  learning: 'bg-secondary',
  new: 'bg-[var(--divider)]',
}
```

In `STATUS_DOT` (lines 247-252) remove the `due` entry so it reads:

```ts
const STATUS_DOT: Record<SrsStatus, string> = {
  known: 'bg-success',
  learning: 'bg-secondary',
  new: 'bg-[var(--text-faint)]',
}
```

Then replace the `counts` memo (lines 260-265):

```ts
  const counts = useMemo(() => {
    const now = Date.now()
    const tally: Record<SrsStatus, number> = { new: 0, due: 0, learning: 0, known: 0 }
    for (const locus of loci) tally[srsStatus(locus.srs, now)] += 1
    return tally
  }, [loci])
```

with:

```ts
  const counts = useMemo(() => {
    const tally: Record<SrsStatus, number> = { new: 0, learning: 0, known: 0 }
    for (const locus of loci) tally[srsStatus(locus.srs)] += 1
    return tally
  }, [loci])
```

(`reviewed = total - counts.new` and the bar's `status !== 'new'` filter below still hold. This widget is fully recomposed in Plan 3; here we only keep it green and correct.)

- [ ] **Step 4: `PalaceDetailPage` counts due via `isDue`**

In `src/pages/palace-detail/ui/PalaceDetailPage.tsx`, add `isDue` to the `shared/lib` import on line 36:

```ts
import { isDue, isLocusReviewed, isRoomCompleted, palaceProgress, roomProgress, srsStatus } from '@/shared/lib'
```

Then replace the loop body (lines 102-107):

```ts
      for (const locus of loci) {
        if (isLocusReviewed(locus)) reviewed += 1
        const status = srsStatus(locus.srs, now)
        if (status === 'known') known += 1
        if (status === 'due') due += 1
      }
```

with:

```ts
      for (const locus of loci) {
        if (isLocusReviewed(locus)) reviewed += 1
        if (srsStatus(locus.srs) === 'known') known += 1
        if (isDue(locus.srs, now)) due += 1
      }
```

(`now` is declared at line 95 and stays used by `isDue`.)

- [ ] **Step 5: Drop `now` from the two locus test files**

In `src/features/locus/locus-commands.test.ts`, in the first assertion block remove the `const now = Date.now()` (line 84) and change line 86 to:

```ts
    expect(inRoom.every((locus) => srsStatus(locus.srs) === 'known')).toBe(true)
```

In the second block remove the `const now = Date.now()` (line 101) and change line 104 to:

```ts
    expect(inRoom.every((locus) => srsStatus(locus.srs) === 'new')).toBe(true)
```

In `src/features/locus/reset-palace-srs.test.ts`, remove the `const now = Date.now()` (line 35) and change lines 40 and 43 to:

```ts
    expect(p1Loci.every((locus) => srsStatus(locus.srs) === 'new')).toBe(true)
```

```ts
    expect(srsStatus(untouched?.srs)).toBe('known')
```

(Removing the `const now` lines is required — with the arg gone they would be unused, and `noUnusedLocals` is on.)

- [ ] **Step 6: Verify the project type-checks and the touched tests pass**

Run: `npm run typecheck`
Expected: PASS (no remaining `srsStatus`/`SrsStatus` type errors anywhere).

Run: `npx vitest run src/features/locus/locus-commands.test.ts src/features/locus/reset-palace-srs.test.ts src/widgets/up-next-card`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/ui/SrsStatusChip.tsx src/widgets/up-next-card/lib/pick-up-next.ts src/pages/room-hub/ui/RoomHubPage.tsx src/pages/palace-detail/ui/PalaceDetailPage.tsx src/features/locus/locus-commands.test.ts src/features/locus/reset-palace-srs.test.ts
git commit -m "refactor: conform srsStatus consumers to maturity buckets"
```

---

### Task 4: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Type-check**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: PASS — all files green. If a previously-unexamined test asserts the old `'due'` status or a 4-bucket count, update it to the maturity contract (new = `new`, learning includes due-but-immature, known includes due-but-mature; due-ness via `isDue`) and re-run.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS — no unused `now` locals/params left behind.

- [ ] **Step 4: Final commit (if Step 2 required any fixups)**

```bash
git add -A
git commit -m "test: align remaining specs with srs maturity buckets"
```

---

## Self-Review

**Spec coverage** — the spec for this plan is ADR-0003 ("maturity is three buckets; due is a queue"):
- Three maturity buckets, ordered New → Learning → Known → Task 1.
- "Due" removed as a status, kept as the `isDue` queue → Task 1 (type), Task 3 Step 4 (PalaceDetail now uses `isDue`).
- Consumers updated (srsStatus, labels, room overview, per-card chips, tests) → Tasks 2–3, named in ADR-0003's Consequences.

**Placeholder scan** — every code step shows complete before/after text; no TBD/"handle edge cases"/"similar to". ✓

**Type consistency** — `SrsStatus = 'new' | 'learning' | 'known'` and `srsStatus(srs)` (1-arg) are defined in Task 1 and used identically in Tasks 2–3 (`srsStatus(locus.srs)`), with `isDue(srs, now)` carrying due-ness. The `now` parameter is removed only from `srsStatus`; it is retained wherever `isDue` still needs it (scope.ts, pick-up-next.ts, PalaceDetailPage). ✓

**Out of scope (later plans):** the daily-goal streak mechanic (Plan 2) and the study-overview UI / Study card / SpeedDial / room-hub + palace-detail recomposition (Plan 3). This plan only re-bases the SRS status model so those can build on it.
