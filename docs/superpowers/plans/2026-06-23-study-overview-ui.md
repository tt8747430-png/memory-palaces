# Study-Overview UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a "cards for today" Study overview on the room hub (scoped to the room) and the palace detail (aggregated across rooms), keep the card carousel as a separate preview, add a whole-set maturity overview, drill the due queue via a scoped review (with "Study ahead" when caught up), move card/question creation into a corner SpeedDial + drawer, and add the daily-goal control to Settings.

**Architecture:** Two new presentational components in `shared/ui` — `StudyOverviewCard` (count + maturity breakdown + Study CTA, mirroring the reference screenshots) and `CardMaturityOverview` (whole-set bar + legend). `ReviewPage` gains a `scope` (`all` | room | palace) so the existing `StudySession` drills the due queue at any scope; two new routes carry the scoped sessions. The room hub and palace detail are recomposed; `SpeedDial` is added to both with create/import actions; the room editor's inline add is removed. Decision recorded in [docs/adr/0004-study-overview-on-detail-surfaces.md](../../adr/0004-study-overview-on-detail-surfaces.md).

**Tech Stack:** React 19, TypeScript (strict), TanStack Router (code-based), motion, lucide-react, Tailwind v4, Vitest + RTL, i18next.

**Depends on:** Plan 1 (3-bucket `srsStatus`) and Plan 2 (the daily-goal streak + the `reward({ itemsPracticed })` signature).

## Global Constraints

- **Strict TS:** no `any`; `noUnusedLocals` + `noUnusedParameters` ON.
- **Mobile-only:** 44px+ targets, `whileTap`/spring feedback; build on the `shared/ui` kit and `motion`/`lucide-react`/`cn`.
- **Domain language (CONTEXT.md):** "cards for today" is the **due queue**; maturity buckets are **New / Learning / Known**; the user-facing word is **card** (never "flashcard"); never "deck" — say **"cards in this room"** / **"cards in this palace"**. The Study overview sits *apart from* the carousel.
- **FSD:** `app → pages → widgets → features → entities → shared`; presentational components in `shared/ui` read no stores; never import a concrete adapter into entities/features.
- **i18n:** all copy via i18next keys.
- **Name clash:** `@/widgets/study-session` already exports a `StudyCard` **type** (`{ locus, palaceName, roomTitle }`). The new component is `StudyOverviewCard` — do not reuse the name `StudyCard`.
- **Tests:** Vitest `globals: false`; colocate `*.test.tsx`.
- **Commands:** `npm run typecheck`, `npm run test`, `npm run lint`, single file `npx vitest run <path>`.

## File Structure

| File | Change |
|------|--------|
| `src/shared/lib/stats.ts` | Add `cardMaturityCounts(loci)` |
| `src/shared/lib/stats.test.ts` | Cover `cardMaturityCounts` |
| `src/shared/ui/StudyOverviewCard.tsx` | New — count + breakdown + Study CTA |
| `src/shared/ui/StudyOverviewCard.test.tsx` | New |
| `src/shared/ui/CardMaturityOverview.tsx` | New — whole-set bar + legend |
| `src/shared/ui/index.ts` | Export the two components |
| `src/pages/settings/ui/SettingsPage.tsx` | Daily-goal `SegmentedControl` row |
| `src/pages/review/ui/ReviewPage.tsx` | `scope` prop filters the due queue |
| `src/shared/config/routes.ts` | Add `roomReview`, `palaceReview` |
| `src/app/router.tsx` | Two scoped-review routes; wire study CTAs |
| `src/pages/room-hub/ui/RoomHubPage.tsx` | Recompose: Study card → carousel → modes → cards section + overview; SpeedDial |
| `src/widgets/loci-editor/ui/RoomContentEditor.tsx` | Remove inline QuickAdd + inline Add button; lift add to dial; overview header |
| `src/pages/palace-detail/ui/PalaceDetailPage.tsx` | Recompose: identity + aggregate Study card + rooms; SpeedDial |
| `src/shared/i18n/locales/en.ts` | New copy |

---

### Task 1: Maturity helper + Settings daily-goal control

**Files:**
- Modify: `src/shared/lib/stats.ts`
- Modify: `src/shared/lib/stats.test.ts`
- Modify: `src/shared/lib/index.ts` (export `cardMaturityCounts` — add to the `from './stats'` list)
- Modify: `src/pages/settings/ui/SettingsPage.tsx`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces: `cardMaturityCounts(loci: ReadonlyArray<{ srs?: SrsState }>): { new: number; learning: number; known: number }`.

- [ ] **Step 1: Write the failing helper test**

In `src/shared/lib/stats.test.ts` add (import `cardMaturityCounts`):

```ts
describe('cardMaturityCounts', () => {
  it('tallies new / learning / known', () => {
    const loci = [
      { srs: undefined },
      { srs: { due: '', interval: 3, ease: 2.5, reps: 2, lapses: 0, lastReviewed: '' } },
      { srs: { due: '', interval: 40, ease: 2.5, reps: 5, lapses: 0, lastReviewed: '' } },
      { srs: { due: '', interval: 40, ease: 2.5, reps: 5, lapses: 0, lastReviewed: '' } },
    ]
    expect(cardMaturityCounts(loci)).toEqual({ new: 1, learning: 1, known: 2 })
  })
})
```

- [ ] **Step 2: Run it (fails)**

Run: `npx vitest run src/shared/lib/stats.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the helper**

In `src/shared/lib/stats.ts`, add the import `import { srsStatus, type SrsState } from './srs'` (the file already imports `SrsState`; extend it to include `srsStatus`), then append:

```ts
/** Tally a card set by maturity bucket (independent of due-ness). */
export function cardMaturityCounts(
  loci: ReadonlyArray<{ srs?: SrsState }>,
): { new: number; learning: number; known: number } {
  const counts = { new: 0, learning: 0, known: 0 }
  for (const locus of loci) counts[srsStatus(locus.srs)] += 1
  return counts
}
```

- [ ] **Step 4: Run it (passes)**

Run: `npx vitest run src/shared/lib/stats.test.ts`
Expected: PASS. Add `cardMaturityCounts` to the `from './stats'` re-export in `src/shared/lib/index.ts`.

- [ ] **Step 5: Add the daily-goal control to Settings**

In `src/pages/settings/ui/SettingsPage.tsx`, inside the Preferences `SettingsSection` (after the notifications/sound rows), add a labelled goal picker. Import `SegmentedControl` from `@/shared/ui` and `DAILY_GOAL_OPTIONS` from `@/shared/config`, then render:

```tsx
        <div className="px-4 py-3">
          <p className="text-[length:var(--p-text-body)] font-semibold text-heading">
            {t('settings.dailyGoal')}
          </p>
          <p className="mb-2.5 text-[length:var(--p-text-label)] text-muted-foreground">
            {t('settings.dailyGoalHint')}
          </p>
          <SegmentedControl
            aria-label={t('settings.dailyGoal')}
            value={String(prefs.dailyGoal)}
            onChange={(value) => update({ dailyGoal: Number(value) })}
            options={DAILY_GOAL_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
```

(`prefs` and the `update({ … })` helper already exist in the file — verified at `:81`.)

- [ ] **Step 6: Add copy + commit**

In `src/shared/i18n/locales/en.ts` `settings` section add:

```ts
    dailyGoal: 'Daily goal',
    dailyGoalHint: 'Cards, questions, matches or verses to practise each day to keep your streak.',
```

Run: `npm run typecheck` → PASS; `npx vitest run src/shared/lib/stats.test.ts` → PASS.

```bash
git add src/shared/lib/stats.ts src/shared/lib/stats.test.ts src/shared/lib/index.ts src/pages/settings/ui/SettingsPage.tsx src/shared/i18n/locales/en.ts
git commit -m "feat: maturity tally helper and Settings daily-goal control"
```

---

### Task 2: `StudyOverviewCard` component

**Files:**
- Create: `src/shared/ui/StudyOverviewCard.tsx`
- Create: `src/shared/ui/StudyOverviewCard.test.tsx`
- Modify: `src/shared/ui/index.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces:

```ts
export interface StudyOverviewCardProps {
  /** Cards due today in this scope. */
  count: number
  /** Maturity split of the due set. */
  breakdown: { new: number; learning: number; known: number }
  /** Drill the due queue (only meaningful when count > 0). */
  onStudy: () => void
  /** Practise the whole set when nothing is due. */
  onStudyAhead?: () => void
  /** Copy variant: a single room vs the whole palace. */
  scope: 'room' | 'palace'
}
```

- [ ] **Step 1: Write the component test**

Create `src/shared/ui/StudyOverviewCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyOverviewCard } from './StudyOverviewCard'

describe('StudyOverviewCard', () => {
  it('shows the due count and fires onStudy', async () => {
    const onStudy = vi.fn()
    render(
      <StudyOverviewCard
        count={8}
        breakdown={{ new: 0, learning: 0, known: 8 }}
        onStudy={onStudy}
        scope="room"
      />,
    )
    expect(screen.getByText('8')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study cards/i }))
    expect(onStudy).toHaveBeenCalledOnce()
  })

  it('shows a caught-up state and offers study-ahead at 0 due', async () => {
    const onStudyAhead = vi.fn()
    render(
      <StudyOverviewCard
        count={0}
        breakdown={{ new: 0, learning: 0, known: 0 }}
        onStudy={vi.fn()}
        onStudyAhead={onStudyAhead}
        scope="room"
      />,
    )
    expect(screen.getByText(/caught up/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /study ahead/i }))
    expect(onStudyAhead).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run it (fails — no component)**

Run: `npx vitest run src/shared/ui/StudyOverviewCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the component**

Create `src/shared/ui/StudyOverviewCard.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Check, GraduationCap } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from './Button'
import { GlassCard } from './GlassCard'

export interface StudyOverviewCardProps {
  count: number
  breakdown: { new: number; learning: number; known: number }
  onStudy: () => void
  onStudyAhead?: () => void
  scope: 'room' | 'palace'
}

/** The "cards for today" study panel (see the reference screenshots): a big due count,
 * a New/Learning/Known split of that queue, and the Study action. Sits apart from the
 * card carousel. When nothing is due it becomes a calm caught-up state with an optional
 * "Study ahead" to practise the whole set early. */
export function StudyOverviewCard({ count, breakdown, onStudy, onStudyAhead, scope }: StudyOverviewCardProps) {
  const { t } = useTranslation()

  if (count === 0) {
    return (
      <GlassCard className="flex flex-col items-center gap-3 py-7 text-center">
        <span className="grid size-12 place-items-center rounded-card-featured bg-card text-[var(--success-foreground)] shadow-rest">
          <Check className="size-6" aria-hidden />
        </span>
        <p className="text-[length:var(--p-text-sub)] font-semibold text-heading">
          {t('study.caughtUp')}
        </p>
        {onStudyAhead ? (
          <Button variant="secondary" onClick={onStudyAhead}>
            {t('study.studyAhead')}
          </Button>
        ) : null}
      </GlassCard>
    )
  }

  const items: Array<{ key: 'new' | 'learning' | 'known'; value: number }> = [
    { key: 'new', value: breakdown.new },
    { key: 'learning', value: breakdown.learning },
    { key: 'known', value: breakdown.known },
  ]

  return (
    <GlassCard className="space-y-4 text-center">
      <div>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[length:var(--p-text-display)] font-bold leading-none tabular-nums text-heading"
        >
          {count}
        </motion.p>
        <p className="mt-1 text-[length:var(--p-text-body)] font-medium text-secondary">
          {t('study.cardsForToday', { count })}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-control bg-info-surface px-2 py-2">
            <dd className="text-[length:var(--p-text-sub)] font-bold leading-none tabular-nums text-heading">
              {item.value}
            </dd>
            <dt className="mt-1 text-[length:var(--p-text-tiny)] font-medium text-secondary">
              {t(`srs.${item.key}`)}
            </dt>
          </div>
        ))}
      </dl>

      <Button className="w-full" onClick={onStudy}>
        <GraduationCap className="size-[18px]" aria-hidden />
        {t(scope === 'palace' ? 'study.studyPalace' : 'study.studyCards')}
      </Button>
    </GlassCard>
  )
}
```

(If `Button`/`GlassCard` are exported from the barrel only, import them from `./Button` and `./GlassCard` as shown — match the path style of neighbouring files in `shared/ui`. `cn` removed if unused — it is unused here, so do **not** import it; the import line above is illustrative, drop `cn` to satisfy `noUnusedLocals`.)

- [ ] **Step 4: Run it (passes)**

Run: `npx vitest run src/shared/ui/StudyOverviewCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Export + copy + commit**

Add to `src/shared/ui/index.ts`: `export { StudyOverviewCard, type StudyOverviewCardProps } from './StudyOverviewCard'`.

In `src/shared/i18n/locales/en.ts`, add a `study` section (or extend it) with:

```ts
    cardsForToday_one: '{{count}} card for today',
    cardsForToday_other: '{{count}} cards for today',
    studyCards: 'Study cards',
    studyPalace: 'Study palace',
    studyAhead: 'Study ahead',
    caughtUp: "You're all caught up",
```

```bash
git add src/shared/ui/StudyOverviewCard.tsx src/shared/ui/StudyOverviewCard.test.tsx src/shared/ui/index.ts src/shared/i18n/locales/en.ts
git commit -m "feat: StudyOverviewCard (cards-for-today panel)"
```

---

### Task 3: `CardMaturityOverview` component

**Files:**
- Create: `src/shared/ui/CardMaturityOverview.tsx`
- Modify: `src/shared/ui/index.ts`
- Modify: `src/shared/i18n/locales/en.ts`

**Interfaces:**
- Produces:

```ts
export interface CardMaturityOverviewProps {
  /** Total cards in the set. */
  total: number
  counts: { new: number; learning: number; known: number }
  /** Heading copy variant. */
  scope: 'room' | 'palace'
}
```

- [ ] **Step 1: Implement the component**

Create `src/shared/ui/CardMaturityOverview.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

export interface CardMaturityOverviewProps {
  total: number
  counts: { new: number; learning: number; known: number }
  scope: 'room' | 'palace'
}

const ORDER: Array<'new' | 'learning' | 'known'> = ['new', 'learning', 'known']
const FILL: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-[var(--divider)]',
  learning: 'bg-secondary',
  known: 'bg-success',
}
const DOT: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-[var(--text-faint)]',
  learning: 'bg-secondary',
  known: 'bg-success',
}

/** Whole-set maturity overview: "Cards in this room (N)" + a New/Learning/Known bar and
 * legend. Reads no stores — counts are passed in. */
export function CardMaturityOverview({ total, counts, scope }: CardMaturityOverviewProps) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2 text-[length:var(--p-text-label)] font-semibold text-heading">
        {t(scope === 'palace' ? 'study.cardsInPalace' : 'study.cardsInRoom', { count: total })}
      </p>
      {total > 0 ? (
        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--divider)]" aria-hidden>
          {ORDER.filter((k) => counts[k] > 0).map((k) => (
            <span
              key={k}
              className={cn('h-full transition-[width] duration-500 ease-out', FILL[k])}
              style={{ width: `${(counts[k] / total) * 100}%` }}
            />
          ))}
        </div>
      ) : null}
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {ORDER.map((k) => (
          <li
            key={k}
            className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] text-muted-foreground"
          >
            <span className={cn('size-2 rounded-full', DOT[k])} aria-hidden />
            {t(`srs.${k}`)}
            <span className="font-semibold text-heading">{counts[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Export + copy**

Add to `src/shared/ui/index.ts`: `export { CardMaturityOverview, type CardMaturityOverviewProps } from './CardMaturityOverview'`.

In `src/shared/i18n/locales/en.ts` `study` section add:

```ts
    cardsInRoom_one: 'Cards in this room ({{count}})',
    cardsInRoom_other: 'Cards in this room ({{count}})',
    cardsInPalace_one: 'Cards in this palace ({{count}})',
    cardsInPalace_other: 'Cards in this palace ({{count}})',
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck` → PASS.

```bash
git add src/shared/ui/CardMaturityOverview.tsx src/shared/ui/index.ts src/shared/i18n/locales/en.ts
git commit -m "feat: CardMaturityOverview (whole-set maturity bar)"
```

---

### Task 4: Scoped review (room / palace) + routes

**Files:**
- Modify: `src/pages/review/ui/ReviewPage.tsx`
- Modify: `src/shared/config/routes.ts`
- Modify: `src/app/router.tsx`

**Interfaces:**
- Produces: `ReviewPageProps` gains `scope?: { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }` (absent = whole library). New routes `ROUTES.roomReview = '/rooms/$roomId/review'` and `ROUTES.palaceReview = '/palaces/$palaceId/review'`.

- [ ] **Step 1: Add the routes**

In `src/shared/config/routes.ts`, add to `ROUTES`:

```ts
  roomReview: '/rooms/$roomId/review',
  palaceReview: '/palaces/$palaceId/review',
```

- [ ] **Step 2: Filter the due queue by scope**

In `src/pages/review/ui/ReviewPage.tsx`:

- Extend props:

```ts
export interface ReviewPageProps {
  onBack?: () => void
  /** Restrict the due queue to a single room or palace; absent reviews the whole library. */
  scope?: { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }
}
```

- Destructure `scope` and, right after the `due` memo (line 57), narrow it:

```ts
  const scopedDue = useMemo(() => {
    if (!scope) return due
    if (scope.kind === 'room') return due.filter((card) => card.roomId === scope.roomId)
    return due.filter((card) => card.palaceId === scope.palaceId)
  }, [due, scope])
```

- Replace every later use of `due` with `scopedDue` (the `liveCards` memo's `due.flatMap` → `scopedDue.flatMap`, and the `livePalaceCount` memo → over `scopedDue`). Update the `liveCards`/`livePalaceCount` dependency arrays to `[scopedDue, byId]` / `[scopedDue]`.
- In `onComplete`, pass the item count (Plan 2 signature): `void reward({ xp: studyXp(summary.graded), itemsPracticed: summary.graded })`.

- [ ] **Step 3: Wire the two scoped routes**

In `src/app/router.tsx`, add two routes mirroring the existing `review` route but rendering `ReviewPage` with a scope built from the path param, e.g.:

```tsx
// room-scoped review
<ReviewPage scope={{ kind: 'room', roomId }} onBack={() => navigate({ to: routes.roomHub, params: { roomId } })} />
// palace-scoped review
<ReviewPage scope={{ kind: 'palace', palaceId }} onBack={() => navigate({ to: routes.palaceDetail, params: { palaceId } })} />
```

Register them at paths `routes.roomReview` and `routes.palaceReview`, following the file's existing route-definition pattern (param extraction + element wrapper). Reuse the `navigate`/`routes` idioms already present.

- [ ] **Step 4: Typecheck + test + commit**

Run: `npm run typecheck` → PASS. Run: `npx vitest run src/pages/review` → PASS (update the ReviewPage test if it constructs the page without the new optional prop — it stays optional, so existing calls are unaffected).

```bash
git add src/pages/review/ui/ReviewPage.tsx src/shared/config/routes.ts src/app/router.tsx
git commit -m "feat: scoped (room/palace) due review sessions"
```

---

### Task 5: Recompose the room hub

**Files:**
- Modify: `src/pages/room-hub/ui/RoomHubPage.tsx`
- Modify: `src/app/router.tsx`

**Interfaces:**
- Consumes: `StudyOverviewCard`, `CardMaturityOverview`, `cardMaturityCounts`, `isDue`, `SpeedDial`.
- Produces: `RoomHubPageProps` gains `onStudyDue?: () => void` (room-scoped review) and keeps `onStudy` (whole-room, used as Study ahead). The dial's create actions reuse the existing `RoomContentEditor` add handlers via new props (Task 6).

- [ ] **Step 1: Compute the due set and maturity**

In `RoomHubPage`, after `loci`/`questions` memos, add:

```ts
  const now = Date.now()
  const dueLoci = useMemo(() => loci.filter((locus) => isDue(locus.srs, now)), [loci, now])
  const dueBreakdown = useMemo(() => cardMaturityCounts(dueLoci), [dueLoci])
  const maturity = useMemo(() => cardMaturityCounts(loci), [loci])
```

Add `isDue` and `cardMaturityCounts` to the `@/shared/lib` import. (`srsStatus`/`SrsStatus` use in `RoomProgress` is replaced below.)

- [ ] **Step 2: Replace `RoomProgress` + `StudyView` with the new stack**

In the returned `<AppScreen>` body, replace the `<RoomProgress … />` and `<StudyView … />` block (lines ~181-204) so the order is **Study card → carousel → mode tiles → manage section** (the manage section now leads with the maturity overview):

```tsx
      <div className="mt-2 space-y-5 pb-24">
        <StudyOverviewCard
          count={dueLoci.length}
          breakdown={dueBreakdown}
          onStudy={() => onStudyDue?.()}
          onStudyAhead={onStudy}
          scope="room"
        />

        {hasLociPreview ? (
          <LociPreviewCarousel
            loci={loci}
            direction={palace?.settings.studyDirection ?? 'front'}
            speakable={palace?.settings.textToSpeech ?? false}
            onOpen={onStudy}
            openLabel={t('roomHub.modes.flashcards')}
          />
        ) : null}

        <ModeTiles
          loci={loci}
          questionCount={questions.length}
          bibleMode={palace?.bibleMode ?? false}
          onMatch={onMatch}
          onTest={onTest}
          onVerse={onVerse}
        />

        <section aria-label={t('roomHub.manageHeading')} className="space-y-3">
          <CardMaturityOverview total={loci.length} counts={maturity} scope="room" />
          <RoomContentEditor
            roomId={roomId}
            roomName={room.title}
            bibleMode={palace?.bibleMode ?? false}
          />
        </section>
      </div>
```

Where `hasLociPreview = loci.length > 0`. Extract the existing mode-tiles JSX (the `bibleMode`/Match/Test tiles from the old `StudyView`) into a small `ModeTiles` component in this file (keep the `ModeTile` helper). Delete the old `RoomProgress` function and the `STATUS_*` maps (the maturity overview replaces them); delete the old `StudyView` (its carousel + tiles are now inline/`ModeTiles`).

Add imports: `StudyOverviewCard`, `CardMaturityOverview` from `@/shared/ui`. Increase the bottom padding to clear the dial (`pb-24`).

- [ ] **Step 3: Add the SpeedDial**

Before `</AppScreen>` closes, add (the create handlers are exposed by `RoomContentEditor` in Task 6 via a ref or lifted state; simplest is local state in `RoomHubPage` that opens the editor sheets — see Task 6 which lifts `addCard`/`addQuestion`/`openImport` to props). For now wire the dial to call those:

```tsx
      <SpeedDial
        label={t('roomHub.quickActions')}
        className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
        actions={[
          { id: 'card', label: t('loci.addCard'), icon: <Plus className="size-5" aria-hidden />, onSelect: () => setAddTarget('card') },
          { id: 'question', label: t('questions.addQuestion'), icon: <HelpCircle className="size-5" aria-hidden />, onSelect: () => setAddTarget('question') },
          { id: 'import', label: t('loci.transfer.importShort'), icon: <Upload className="size-5" aria-hidden />, onSelect: () => setImportOpen(true) },
        ]}
      />
```

Add `SpeedDial` to the `@/shared/ui` import and `Plus`, `HelpCircle`, `Upload` to lucide. Add local state `const [addTarget, setAddTarget] = useState<'card' | 'question' | null>(null)` and `const [importOpen, setImportOpen] = useState(false)`, passed into `RoomContentEditor` (Task 6). The `className` override re-pins the dial above the safe-area edge because the hub has no bottom nav.

- [ ] **Step 4: Wire `onStudyDue` in the router**

In `src/app/router.tsx`, on the room-hub route element add `onStudyDue={() => navigate({ to: routes.roomReview, params: { roomId } })}` (keep the existing `onStudy` → `routes.roomTrain`). Add `onStudyDue?: () => void` to `RoomHubPageProps`.

- [ ] **Step 5: Add copy, typecheck, commit**

In `src/shared/i18n/locales/en.ts` `roomHub` section add `quickActions: 'Quick actions'`.

Run: `npm run typecheck` → PASS (it will flag the `RoomContentEditor` prop additions until Task 6; if executing strictly task-by-task, do Task 6 before this typecheck, or stub the props). Run `npx vitest run src/pages/room-hub`.

```bash
git add src/pages/room-hub/ui/RoomHubPage.tsx src/app/router.tsx src/shared/i18n/locales/en.ts
git commit -m "feat: recompose room hub with study overview + maturity + dial"
```

> **Sequencing note:** Tasks 5 and 6 are mutually dependent (the dial drives the editor's add sheets). Execute them as a pair and run `npm run typecheck` only after both are in. A reviewer should gate them together.

---

### Task 6: Lift the room editor's add into the dial + drawer; add the overview header

**Files:**
- Modify: `src/widgets/loci-editor/ui/RoomContentEditor.tsx`

**Interfaces:**
- Consumes: dial state from `RoomHubPage` (Task 5).
- Produces: `RoomContentEditorProps` gains `addTarget?: 'card' | 'question' | null`, `onAddHandled?: () => void`, `importOpen?: boolean`, `onImportOpenChange?: (open: boolean) => void`.

- [ ] **Step 1: Accept externally-driven add/import**

In `src/widgets/loci-editor/ui/RoomContentEditor.tsx`:

- Extend the props interface with the four optional props above.
- Drive the editor sheet from `addTarget`: when `addTarget === 'card'` open the `CardEditorSheet` with `initial=null`; when `'question'` open the `QuestionEditorSheet`. On close, call `onAddHandled?.()`. Replace the local `editor` state's create path so the dial opens it (keep the row-level **edit** path that sets `editor` to an existing item).

A minimal approach: derive the sheet's open state as `editor?.kind === 'locus' || addTarget === 'card'` etc., and in `onOpenChange(false)` call both `setEditor(null)` and `onAddHandled?.()`.

- Drive the transfer sheet from `importOpen`/`onImportOpenChange` instead of (or in addition to) the local `transferOpen` — replace `transferOpen`/`setTransferOpen` wiring with the controlled props when provided: `const transferOpen = props.importOpen ?? localTransferOpen` and `const setTransferOpen = props.onImportOpenChange ?? setLocalTransferOpen`.

- [ ] **Step 2: Remove the inline add UI**

- Delete the `QuickAdd` render (lines ~414-423) and the `QuickAdd` component (lines ~640-706) and the `quickFront`/`quickBack`/`quickAdd`/`quickFrontRef` state and handler.
- Delete the bottom full-width inline Add button branch (the `hasItems ? <Button …>Add card/Add question</Button> : null` at lines ~531-542) — adding now lives in the dial. Keep the select-mode bulk bar.
- Keep the `EmptyContent` empty-state CTAs (they call `setEditor({ kind:…, … })` / `setTransferOpen(true)`) — they remain valid first-card affordances; route their `onAdd` through the same create path.
- Remove the toolbar's import `IconButton` (the `Upload` button at lines ~334-340) since import moved to the dial; keep the tabs `SegmentedControl`.

- [ ] **Step 3: Typecheck the pair + commit**

Run: `npm run typecheck` → PASS. Run: `npx vitest run src/pages/room-hub src/widgets/loci-editor` → PASS (update any editor test that asserted the inline QuickAdd or the inline Add button).

```bash
git add src/widgets/loci-editor/ui/RoomContentEditor.tsx
git commit -m "feat: move card/question add to the room hub dial + drawer"
```

---

### Task 7: Recompose palace detail

**Files:**
- Modify: `src/pages/palace-detail/ui/PalaceDetailPage.tsx`
- Modify: `src/app/router.tsx`

**Interfaces:**
- Consumes: `StudyOverviewCard`, `cardMaturityCounts`, `isDue`, `SpeedDial`.
- Produces: `PalaceDetailPageProps` gains `onStudyPalace?: () => void` (palace-scoped review).

- [ ] **Step 1: Compute palace-wide due + maturity**

In `PalaceDetailPage`, the `items`/`summary` memos already iterate the palace's loci. Add alongside them:

```ts
  const palaceLoci = useMemo(
    () => allLoci.filter((locus) => rooms.some((room) => room.id === locus.roomId)),
    [allLoci, rooms],
  )
  const dueLoci = useMemo(() => palaceLoci.filter((locus) => isDue(locus.srs, now)), [palaceLoci, now])
  const dueBreakdown = useMemo(() => cardMaturityCounts(dueLoci), [dueLoci])
```

Use the existing snapshot clock (the component already computes `now` inside the `items` memo — hoist a single `const now = Date.now()` at the top of the component body and reuse it for `items` and these memos). `isDue` and `cardMaturityCounts` are already imported (Plan 1 added `isDue`).

- [ ] **Step 2: Replace `PalaceHero`'s stats/Continue with the Study card**

Replace `<PalaceHero … />` (lines ~189-195) with a slim identity block + the Study card. Keep the existing cover/description and the overall-progress bar from `PalaceHero` (extract them into a small `PalaceIdentity` that drops the 4-stat `dl` and the Continue `Button`), then render the Study card under it:

```tsx
        <PalaceIdentity palace={palace} progress={summary.progress} onEditIdentity={onOpenSettings} />

        <StudyOverviewCard
          count={dueLoci.length}
          breakdown={dueBreakdown}
          onStudy={() => onStudyPalace?.()}
          onStudyAhead={nextRoom ? () => onOpenRoom?.(nextRoom.id) : undefined}
          scope="palace"
        />
```

Delete the `stats` array and the `nextRoom`/Continue button from `PalaceHero`; keep `CoverButton`. Import `StudyOverviewCard` from `@/shared/ui`.

- [ ] **Step 3: Move Add room / Import into a SpeedDial**

Remove the inline `Upload`/`Add room` buttons from the rooms section header (lines ~202-214) and add a dial before `</AppScreen>`:

```tsx
      <SpeedDial
        label={t('palaceDetail.quickActions')}
        className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
        actions={[
          { id: 'room', label: t('palaceDetail.addRoom'), icon: <Plus className="size-5" aria-hidden />, onSelect: () => setEditorTarget({ mode: 'add', palaceId }) },
          { id: 'import', label: t('importRooms.open'), icon: <Upload className="size-5" aria-hidden />, onSelect: () => setImportOpen(true) },
        ]}
      />
```

Add `SpeedDial` to the `@/shared/ui` import. Increase the body bottom padding to `pb-24`.

- [ ] **Step 4: Wire `onStudyPalace` in the router**

In `src/app/router.tsx`, on the palace-detail route element add `onStudyPalace={() => navigate({ to: routes.palaceReview, params: { palaceId } })}`. Add `onStudyPalace?: () => void` to `PalaceDetailPageProps`.

- [ ] **Step 5: Copy, typecheck, commit**

In `src/shared/i18n/locales/en.ts` `palaceDetail` section add `quickActions: 'Quick actions'`.

Run: `npm run typecheck` → PASS. Run: `npx vitest run src/pages/palace-detail` → PASS (update the palace-detail test if it asserted the old hero stats/Continue button).

```bash
git add src/pages/palace-detail/ui/PalaceDetailPage.tsx src/app/router.tsx src/shared/i18n/locales/en.ts
git commit -m "feat: recompose palace detail with aggregate study overview + dial"
```

---

### Task 8: Full verification

- [ ] **Step 1:** `npm run typecheck` → PASS.
- [ ] **Step 2:** `npm run test` → PASS (whole suite; update any page test still asserting the removed `RoomProgress` legend, the inline QuickAdd, or the old palace hero).
- [ ] **Step 3:** `npm run lint` → PASS.
- [ ] **Step 4 (manual smoke, optional):** `npm run dev` — open a room: Study card shows "N cards for today" + New/Learning/Known, carousel below, mode tiles, then "Cards in this room (N)" + list; the corner dial adds a card via the sheet. Open a palace: aggregate Study card + rooms; dial adds a room. Tap Study cards → drills only the due set; when 0 due, the card shows caught-up + Study ahead.
- [ ] **Step 5:** Commit any fixups.

```bash
git add -A
git commit -m "test: align hub/detail specs with the study-overview UI"
```

---

## Self-Review

**Spec coverage (ADR-0004 + the grilled design):**
- Study overview on room hub (scoped) and palace detail (aggregate) → Tasks 2, 5, 7.
- Carousel kept as a separate preview → Task 5 (rendered after the Study card).
- Whole-set maturity overview heading the cards section → Tasks 3, 5.
- Scoped due review + "Study ahead" reusing the whole-set session → Tasks 4, 5, 7.
- Corner SpeedDial on both surfaces with create/import; inline card/question add removed → Tasks 5, 6, 7.
- Daily-goal control in Settings (deferred from Plan 2) → Task 1.
- Copy obeys the glossary ("cards in this room", "card", no "deck") → Tasks 2, 3.

**Placeholder scan:** new components/helpers are shown in full; page edits cite exact regions and give literal replacement JSX. The router and `RoomContentEditor` controlled-prop edits describe the precise wiring and name the existing handlers to reuse. ✓

**Type consistency:** `StudyOverviewCardProps` / `CardMaturityOverviewProps` (Tasks 2–3) are consumed unchanged in Tasks 5 and 7; `cardMaturityCounts` returns `{ new; learning; known }` (Task 1) matching both components' `breakdown`/`counts`. `ReviewPageProps.scope` (Task 4) is produced by the room/palace routes in Tasks 5/7. The new component avoids the existing `StudyCard` type name. ✓

**Cross-plan dependency:** assumes Plan 1's 1-arg `srsStatus` (used by `cardMaturityCounts`) and Plan 2's `reward({ itemsPracticed })` (used by the scoped `ReviewPage`). Execute in order 1 → 2 → 3.
