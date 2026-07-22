# UI Component Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add colocated behavior tests to the ~75 currently-untested UI primitives, shared components, and widgets, deep enough to cover every real state each component has.

**Architecture:** One tiny shared render helper (`renderWithProviders`) plus a `ResizeObserver` jsdom stub, then characterization tests written bottom-up (primitives → shared/ui → widgets) in reviewable batches, each ending on a green `typecheck && lint && test`. These are tests for *existing* components — a correctly-written test passes on first run; a failure means a wrong assumption or a real bug to flag, never something to force green.

**Tech Stack:** Vitest 4 (`globals: false`), `@testing-library/react` 16, `@testing-library/user-event` 14, `@testing-library/jest-dom` 6, jsdom, `motion/react` (`MotionConfig`), `react-i18next`.

## Global Constraints

- Import `describe/it/expect/vi` from `vitest` (globals are off). `afterEach(cleanup)` in every file.
- Use `@testing-library/user-event` for interaction; reserve `fireEvent` for low-level events user-event can't express.
- **Query by role + accessible name / visible text.** Never add or query `data-testid`. For a decorative element with no accessible name, query via `container.querySelector(...)`.
- **Prefer behavior over classes.** Assert a Tailwind class token *only* when a variant/prop has no other observable effect (e.g. a presentational `Badge` variant).
- Wrap every render in `renderWithProviders` (Task 1) so i18n + reduced-motion context is present, even for components that don't obviously need it — it's cheap and uniform.
- **Characterization only — never change component behavior.** If an assertion can't be made true without editing the component, stop and report a suspected bug; do not edit the component and do not assert the buggy output as "expected".
- **Don't re-test Base-UI / shadcn internals.** Test our wiring: variants, callbacks, a11y attributes, composed open/close/empty/error states.
- `import type` for type-only imports (`verbatimModuleSyntax`). Prettier: no semicolons, single quotes, trailing-comma `all`, printWidth 100.
- Format only touched files: `npx prettier --write <files>`. Never `npm run format`.
- FSD boundaries are lint-enforced but **exempt `*.{test,spec}.{ts,tsx}`** — so a test file may import any layer. A **non-test** helper may not import upward; keep shared helpers shared-only, and colocate domain fixtures in the layer that owns them.

### The Test Contract (what "deep — all real states" means)

For each component, cover the subset of these that the component **actually has**:

1. **Render / variants** — each variant / size / tone / orientation branch renders its distinguishing output.
2. **Interaction** — every callback fires with the correct argument via `user-event`; `disabled` / `loading` suppresses it; keyboard (Enter / Space / Escape / arrows) where the component handles it.
3. **A11y** — role, accessible name, and aria-state (`aria-checked` / `aria-pressed` / `aria-expanded` / `aria-disabled`); focus / portal behavior for overlays.
4. **Content states** — `loading`, `empty`, `error`, and **`offline`** *only where the component renders them*. A component with none (e.g. a pure display pill) satisfies the contract with its variant tests.

### Fixture signatures (verified — use exactly these)

```ts
// @/entities/deck — required: id, createdAt, name
makeDeck({ id, createdAt, name /*, description, icon, color, parentId, folderId, order, favorite, archived, settings */ })
// @/entities/card — required: id, createdAt, deckId, front, back
makeCard({ id, createdAt, deckId, front, back /*, hint, tip, srs, flagged, memorized, order */ })
// @/entities/preferences
type StudyMode = 'blur' | 'words' | 'initials' | 'type'
```

### Pattern Library (complete, reusable worked examples)

Each task names which patterns to apply. These are the canonical shapes — copy the structure, swap in the component's real props/states.

**Pattern A — Display / variant primitive** (no interaction, no i18n):

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Badge } from './badge'

afterEach(cleanup)

describe('Badge', () => {
  it('renders children with the default variant', () => {
    renderWithProviders(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge.className).toContain('bg-secondary')
  })

  it('applies the requested variant', () => {
    renderWithProviders(<Badge variant="outline">Draft</Badge>)
    expect(screen.getByText('Draft').className).toContain('border')
  })

  it('forwards arbitrary span props', () => {
    renderWithProviders(<Badge aria-label="status">•</Badge>)
    expect(screen.getByLabelText('status')).toBeInTheDocument()
  })
})
```

**Pattern B — Interactive control** (callbacks, disabled, a11y state):

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Button } from './button'

afterEach(cleanup)

describe('Button', () => {
  it('renders as a button and fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(<Button onClick={onClick}>Save</Button>)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies the destructive variant surface', () => {
    renderWithProviders(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('danger')
  })
})
```

**Pattern C — Portal / overlay** (Base-UI trigger → portal content → dismiss). Confirm the exact Trigger/Close composition against an existing consumer (`ConfirmDialog.tsx`, `FlyoutMenu.tsx`) before writing:

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

afterEach(cleanup)

describe('AlertDialog', () => {
  it('opens from the trigger and renders title + description in a portal, then closes', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AlertDialog>
        <AlertDialogTrigger>Delete deck</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete deck?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <AlertDialogClose>Cancel</AlertDialogClose>
        </AlertDialogContent>
      </AlertDialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete deck' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Delete deck?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })
})
```

**Pattern D — Gesture / DnD wiring** (assert wiring & order-sorted output, not drag physics):

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeDeck } from '@/entities/deck'
import { DeckTree } from './DeckTree'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

describe('DeckTree', () => {
  it('renders top-level decks in order and opens one on tap', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const decks = [
      makeDeck({ id: 'b', createdAt: CREATED, name: 'Second', order: 1 }),
      makeDeck({ id: 'a', createdAt: CREATED, name: 'First', order: 0 }),
    ]
    renderWithProviders(
      <DeckTree
        decks={decks}
        cards={[]}
        expanded={new Set()}
        onToggle={() => {}}
        onOpen={onOpen}
        selectMode={false}
        selectedIds={new Set()}
        onRequestSelect={() => {}}
        onToggleSelect={() => {}}
      />,
    )
    // ordering: 'First' (order 0) precedes 'Second' (order 1)
    const names = screen.getAllByText(/First|Second/).map((n) => n.textContent)
    expect(names).toEqual(['First', 'Second'])

    await user.click(screen.getByText('First'))
    expect(onOpen).toHaveBeenCalledWith('a')
  })
})
```

**Pattern E — i18n widget / study face** (uses colocated fixtures + translated labels):

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { InitialsFace } from './InitialsFace'

afterEach(cleanup)

describe('InitialsFace', () => {
  it('masks answer words behind reveal buttons and shows full words on the aid button', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <InitialsFace {...makeFaceProps({ mode: 'initials', answer: 'Pax Romana' })} />,
    )
    expect(screen.getByRole('button', { name: /pax/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show words/i }))
    expect(screen.getByText('Pax Romana', { exact: false })).toBeInTheDocument()
  })
})
```

---

### Task 1: Test harness — `renderWithProviders` + `ResizeObserver` stub

**Files:**
- Create: `src/shared/test/render-with-providers.tsx`
- Create: `src/shared/test/render-with-providers.test.tsx`
- Modify: `src/shared/test/setup.ts` (append `ResizeObserver` stub)

**Interfaces:**
- Produces: `renderWithProviders(ui: ReactElement, opts?: { reducedMotion?: 'always' | 'never' | 'user' } & Omit<RenderOptions, 'wrapper'>): RenderResult` — wraps `ui` in `<I18nextProvider i18n={i18n}>` + `<MotionConfig reducedMotion="always">`. Every later task consumes this.

- [ ] **Step 1: Write the helper**

```tsx
// src/shared/test/render-with-providers.tsx
import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Default 'always' so entrance/exit animations never gate assertions. */
  reducedMotion?: 'always' | 'never' | 'user'
}

export function renderWithProviders(
  ui: ReactElement,
  { reducedMotion = 'always', ...options }: ProviderOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>
      </I18nextProvider>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}
```

- [ ] **Step 2: Append the `ResizeObserver` stub to `setup.ts`**

Add at the end of `src/shared/test/setup.ts`:

```ts
// jsdom has no ResizeObserver; CardFace measures its layout with one (self-guarded in prod).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
```

- [ ] **Step 3: Write the harness smoke test**

```tsx
// src/shared/test/render-with-providers.test.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { renderWithProviders } from './render-with-providers'

afterEach(cleanup)

function Probe() {
  const { t } = useTranslation()
  // any real key works; assert the provider resolves translations, not a specific string
  return <span>{typeof t('common.cancel') === 'string' ? 'i18n-ready' : 'no-i18n'}</span>
}

describe('renderWithProviders', () => {
  it('supplies i18n context to descendants', () => {
    renderWithProviders(<Probe />)
    expect(screen.getByText('i18n-ready')).toBeInTheDocument()
  })

  it('renders arbitrary UI', () => {
    renderWithProviders(<button type="button">Go</button>)
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
```

Before running, confirm `common.cancel` (or substitute any existing key) exists in `src/shared/i18n/locales/en.ts`.

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/shared/test/render-with-providers.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + lint the new files, then commit**

Run: `npm run typecheck && npm run lint`
Expected: no errors (confirms `render-with-providers.tsx` is boundary-legal).

```bash
npx prettier --write src/shared/test/render-with-providers.tsx src/shared/test/render-with-providers.test.tsx src/shared/test/setup.ts
git add src/shared/test/render-with-providers.tsx src/shared/test/render-with-providers.test.tsx src/shared/test/setup.ts
git commit -m "test: add renderWithProviders harness and ResizeObserver stub"
```

---

### Task 2: Primitives — display (`badge`, `card`, `progress`, `empty`)

**Files:**
- Test: `src/shared/ui/primitives/badge.test.tsx`, `card.test.tsx`, `progress.test.tsx`, `empty.test.tsx`

**Patterns:** A (all four are presentational).

**Per-component contract:**
- `badge` — default vs each `variant` (assert distinguishing class token + `data-slot`); forwards span props (`aria-label`).
- `card` — renders each exported sub-part (Card / header / title / content / footer) with `data-slot`; passes children through; merges `className`.
- `progress` — renders with `role="progressbar"`; reflects `value`/`max` via `aria-valuenow`/`aria-valuemax` (or the indicator width if Base-UI omits aria — read the component first); handles `value={0}` and `value` at max.
- `empty` — renders title/description/action slots; the empty state's text and optional action button appear.

**Steps (repeat 3→5 per file):**
- [ ] **Step 1:** Read each component to enumerate its exported parts, props, and variants.
- [ ] **Step 2:** Write `badge.test.tsx` following Pattern A; cover the contract above.
- [ ] **Step 3:** Run `npx vitest run src/shared/ui/primitives/badge.test.tsx` — expect PASS. (A FAIL = wrong assumption or bug; fix the assumption or flag the bug — never edit the component.)
- [ ] **Step 4:** Repeat Steps 2–3 for `card`, `progress`, `empty`.
- [ ] **Step 5:** Verify batch + commit.

```bash
npx vitest run src/shared/ui/primitives/badge.test.tsx src/shared/ui/primitives/card.test.tsx src/shared/ui/primitives/progress.test.tsx src/shared/ui/primitives/empty.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/shared/ui/primitives/{badge,card,progress,empty}.test.tsx
git add src/shared/ui/primitives/{badge,card,progress,empty}.test.tsx
git commit -m "test: cover display primitives (badge, card, progress, empty)"
```

---

### Task 3: Primitives — form controls (`button`, `input`, `textarea`, `field`, `icon-button`)

**Files:**
- Test: `src/shared/ui/primitives/button.test.tsx`, `input.test.tsx`, `textarea.test.tsx`, `field.test.tsx`, `icon-button.test.tsx`

**Patterns:** B (interactive).

**Per-component contract:**
- `button` — see Pattern B verbatim (variants incl. `destructive`, `disabled` suppresses click, `role="button"` + accessible name).
- `input` — typing updates value and fires `onChange`; `disabled` blocks typing; forwards `type`, `placeholder`, `aria-label`; reflects `aria-invalid` when passed.
- `textarea` — same as input for multiline; typing multiple lines works; `disabled` blocks.
- `field` — associates label ↔ control (querying by the label's accessible name finds the control); renders helper/error text and wires `aria-describedby` / `aria-invalid` when in error.
- `icon-button` — renders `role="button"` with an accessible name from its `aria-label` (icon is decorative / `aria-hidden`); fires `onClick`; `disabled` suppresses it.

- [ ] **Step 1:** Read each component (esp. `field` — confirm how it wires label/error to the control).
- [ ] **Step 2:** Write `button.test.tsx` (Pattern B verbatim).
- [ ] **Step 3:** Run it — expect PASS.
- [ ] **Step 4:** Repeat for `input`, `textarea`, `field`, `icon-button`.
- [ ] **Step 5:** Verify batch + commit.

```bash
npx vitest run src/shared/ui/primitives/button.test.tsx src/shared/ui/primitives/input.test.tsx src/shared/ui/primitives/textarea.test.tsx src/shared/ui/primitives/field.test.tsx src/shared/ui/primitives/icon-button.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/shared/ui/primitives/{button,input,textarea,field,icon-button}.test.tsx
git add src/shared/ui/primitives/{button,input,textarea,field,icon-button}.test.tsx
git commit -m "test: cover form-control primitives (button, input, textarea, field, icon-button)"
```

---

### Task 4: Primitives — overlays & groups (`alert-dialog`, `drawer`, `dropdown-menu`, `toggle-group`)

**Files:**
- Test: `src/shared/ui/primitives/alert-dialog.test.tsx`, `drawer.test.tsx`, `dropdown-menu.test.tsx`, `toggle-group.test.tsx`

**Patterns:** C (alert-dialog, drawer, dropdown-menu); B (toggle-group).

**Per-component contract:**
- `alert-dialog` — Pattern C verbatim: opens from trigger, title/description in portal (`role="alertdialog"`), closes via `AlertDialogClose`. Per the component doc it does *not* dismiss on Escape/outside-press — assert Escape leaves it open.
- `drawer` — opens from trigger into a portal; renders its content; dismisses via Escape and/or its close control (read the component for which); focus moves into the drawer.
- `dropdown-menu` — trigger opens a `role="menu"`; items are `role="menuitem"`; selecting an item fires its handler and closes; Escape closes; disabled item does nothing.
- `toggle-group` — renders each option as a pressable with `aria-pressed`; clicking changes selection and fires `onValueChange`; single vs multiple mode (read the component) selects accordingly.

- [ ] **Step 1:** Read each component + confirm Base-UI Trigger/Close composition against `ConfirmDialog.tsx`/`FlyoutMenu.tsx`.
- [ ] **Step 2:** Write `alert-dialog.test.tsx` (Pattern C verbatim).
- [ ] **Step 3:** Run it — expect PASS.
- [ ] **Step 4:** Repeat for `drawer`, `dropdown-menu`, `toggle-group`.
- [ ] **Step 5:** Verify batch + commit.

```bash
npx vitest run src/shared/ui/primitives/alert-dialog.test.tsx src/shared/ui/primitives/drawer.test.tsx src/shared/ui/primitives/dropdown-menu.test.tsx src/shared/ui/primitives/toggle-group.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/shared/ui/primitives/{alert-dialog,drawer,dropdown-menu,toggle-group}.test.tsx
git add src/shared/ui/primitives/{alert-dialog,drawer,dropdown-menu,toggle-group}.test.tsx
git commit -m "test: cover overlay & group primitives (alert-dialog, drawer, dropdown-menu, toggle-group)"
```

---

### Task 5: shared/ui — presentational (17 components)

**Files (all `src/shared/ui/*.test.tsx`):** `GlassCard`, `Chip`, `TierPips`, `SelectDot`, `FolderGlyph`, `BadgeMedallion`, `DeckCover`, `CollectionPreview`, `ScreenHeader`, `StickyBar`, `SettingsSection`, `AppScreen`, `DropIndicator`, `ImportRow`, `IconColorRow`, `CardMaturityOverview`, `OverflowMenuButton`

**Patterns:** A for pure display; B for the few with a callback (`ImportRow`, `IconColorRow`, `OverflowMenuButton`).

**Per-component contract (read each first; cover the states it has):**
- `GlassCard` — renders children; merges `className`; renders as the documented element.
- `Chip` — renders label via the info `Badge`; optional `icon` renders `aria-hidden` (query via `container.querySelector('[aria-hidden]')`).
- `TierPips` — renders N pips; the filled/active count matches the `value`/`tier` prop.
- `SelectDot` — reflects selected vs unselected (aria-checked or the check glyph presence).
- `FolderGlyph` / `DeckCover` — render the provided icon/color/image; fall back to a default when absent (empty state).
- `BadgeMedallion` — renders the badge art + accessible label; locked vs earned state.
- `CollectionPreview` / `CardMaturityOverview` — render the summarized counts; **empty** state (zero items) renders its empty copy.
- `ScreenHeader` — renders title; optional back/action controls fire their callbacks (B).
- `StickyBar` / `AppScreen` / `SettingsSection` — render children/title in the expected slots.
- `DropIndicator` — renders only when active/visible per its prop; correct orientation.
- `ImportRow` / `IconColorRow` / `OverflowMenuButton` — Pattern B: the control fires its callback; disabled/selected state reflected.

- [ ] **Step 1:** Read each component; note which have callbacks/empty states.
- [ ] **Step 2:** Write one test file at a time following the matched pattern + contract.
- [ ] **Step 3:** Run each file as you go — expect PASS.
- [ ] **Step 4:** After all 17, verify batch + commit.

```bash
npx vitest run src/shared/ui/GlassCard.test.tsx src/shared/ui/Chip.test.tsx src/shared/ui/TierPips.test.tsx src/shared/ui/SelectDot.test.tsx src/shared/ui/FolderGlyph.test.tsx src/shared/ui/BadgeMedallion.test.tsx src/shared/ui/DeckCover.test.tsx src/shared/ui/CollectionPreview.test.tsx src/shared/ui/ScreenHeader.test.tsx src/shared/ui/StickyBar.test.tsx src/shared/ui/SettingsSection.test.tsx src/shared/ui/AppScreen.test.tsx src/shared/ui/DropIndicator.test.tsx src/shared/ui/ImportRow.test.tsx src/shared/ui/IconColorRow.test.tsx src/shared/ui/CardMaturityOverview.test.tsx src/shared/ui/OverflowMenuButton.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/shared/ui/*.test.tsx
git add src/shared/ui/{GlassCard,Chip,TierPips,SelectDot,FolderGlyph,BadgeMedallion,DeckCover,CollectionPreview,ScreenHeader,StickyBar,SettingsSection,AppScreen,DropIndicator,ImportRow,IconColorRow,CardMaturityOverview,OverflowMenuButton}.test.tsx
git commit -m "test: cover presentational shared/ui components"
```

---

### Task 6: shared/ui — interactive & overlays (13 components)

**Files (all `src/shared/ui/*.test.tsx`):** `Sheet`, `ActionSheet`, `PromptSheet`, `ConfirmDialog`, `Combobox`, `SortControl`, `SelectToolbar`, `select-actions`, `SpeedDial`, `EditableTitle`, `PasswordField`, `SwipeRow`, `swipe-actions`

**Patterns:** C for portal/overlay (`Sheet`, `ActionSheet`, `PromptSheet`, `ConfirmDialog`, `Combobox`); B for controls (`SortControl`, `SelectToolbar`, `select-actions`, `SpeedDial`, `EditableTitle`, `PasswordField`); D for gesture (`SwipeRow`, `swipe-actions`).

**Per-component contract (read each first):**
- `Sheet` / `ActionSheet` — open via trigger/prop → content in portal; each action fires its handler and closes; Escape / overlay dismiss; safe-area/`open` controlled prop honored.
- `PromptSheet` — renders an input; confirm submits the typed value; cancel/Escape closes without submitting; empty input disables/blocks confirm.
- `ConfirmDialog` — renders title/description; confirm and cancel fire the right callbacks; destructive styling for the confirm when flagged.
- `Combobox` — open lists options (`role="option"`); typing filters; selecting fires `onChange` and closes; **empty** filter renders the no-results state.
- `SortControl` / `SelectToolbar` / `select-actions` — each control fires its callback; the active sort/selection is marked; a count/empty state where present.
- `SpeedDial` — toggles open, reveals actions, each fires its handler, closes after.
- `EditableTitle` — enters edit mode, typing + Enter commits via `onSubmit`, Escape reverts; blank title is rejected/reverted.
- `PasswordField` — toggles masked/visible; the reveal control flips `type` between `password` and `text`; forwards value/onChange.
- `SwipeRow` / `swipe-actions` — Pattern D: assert the revealed action buttons fire their handlers and the config/handlers are wired; do not simulate full drag physics.

- [ ] **Step 1:** Read each component; confirm Base-UI open/close composition from existing consumers.
- [ ] **Step 2:** Write one file at a time (matched pattern + contract).
- [ ] **Step 3:** Run each as you go — expect PASS.
- [ ] **Step 4:** After all 13, verify batch + commit.

```bash
npx vitest run src/shared/ui/Sheet.test.tsx src/shared/ui/ActionSheet.test.tsx src/shared/ui/PromptSheet.test.tsx src/shared/ui/ConfirmDialog.test.tsx src/shared/ui/Combobox.test.tsx src/shared/ui/SortControl.test.tsx src/shared/ui/SelectToolbar.test.tsx src/shared/ui/select-actions.test.tsx src/shared/ui/SpeedDial.test.tsx src/shared/ui/EditableTitle.test.tsx src/shared/ui/PasswordField.test.tsx src/shared/ui/SwipeRow.test.tsx src/shared/ui/swipe-actions.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/shared/ui/*.test.tsx
git add src/shared/ui/{Sheet,ActionSheet,PromptSheet,ConfirmDialog,Combobox,SortControl,SelectToolbar,select-actions,SpeedDial,EditableTitle,PasswordField,SwipeRow,swipe-actions}.test.tsx
git commit -m "test: cover interactive & overlay shared/ui components"
```

---

### Task 7: widgets — presentational (8 components)

**Files:**
- `src/widgets/bottom-nav/ui/AppNav.test.tsx`
- `src/widgets/achievement-list/ui/AchievementGrid.test.tsx`, `AchievementsSection.test.tsx`
- `src/widgets/badge-list/ui/BadgeGrid.test.tsx`, `BadgesSection.test.tsx`, `NextMilestoneCard.test.tsx`
- `src/widgets/threshold/ui/AuthLogo.test.tsx`, `Threshold.test.tsx`

**Patterns:** A/B. All prop-driven; wrap in `renderWithProviders` (they use i18n).

**Per-component contract (read each first):**
- `AppNav` — renders each nav destination as a link/button with its label; marks the active route (`aria-current` or selected style); tapping a destination fires its handler.
- `AchievementGrid` / `BadgeGrid` — render one tile per item; earned vs locked state per tile; **empty** list renders the empty copy.
- `AchievementsSection` / `BadgesSection` — render section heading + the grid; a "next milestone"/progress summary where present.
- `NextMilestoneCard` — renders the next target and progress toward it; the all-done/empty state when nothing remains.
- `AuthLogo` — renders the brand mark with an accessible name.
- `Threshold` — renders its heading/children slots; any primary action fires its callback.

- [ ] **Step 1:** Read each component to enumerate props + states.
- [ ] **Step 2–3:** Write + run each file (expect PASS).
- [ ] **Step 4:** Verify batch + commit.

```bash
npx vitest run src/widgets/bottom-nav/ui/AppNav.test.tsx src/widgets/achievement-list/ui/AchievementGrid.test.tsx src/widgets/achievement-list/ui/AchievementsSection.test.tsx src/widgets/badge-list/ui/BadgeGrid.test.tsx src/widgets/badge-list/ui/BadgesSection.test.tsx src/widgets/badge-list/ui/NextMilestoneCard.test.tsx src/widgets/threshold/ui/AuthLogo.test.tsx src/widgets/threshold/ui/Threshold.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/widgets/bottom-nav/ui/AppNav.test.tsx src/widgets/achievement-list/ui/*.test.tsx src/widgets/badge-list/ui/*.test.tsx src/widgets/threshold/ui/*.test.tsx
git add src/widgets/bottom-nav/ui/AppNav.test.tsx src/widgets/achievement-list/ui src/widgets/badge-list/ui src/widgets/threshold/ui
git commit -m "test: cover presentational widgets (nav, achievements, badges, threshold)"
```

---

### Task 8: widgets — deck-tree, content-editor & folder-form (7 components)

**Files:**
- `src/widgets/deck-tree/ui/DeckTree.test.tsx`
- `src/widgets/content-editor/ui/ReorderableList.test.tsx`, `ContentRows.test.tsx`, `editor-fields.test.tsx`, `CardBrowser.test.tsx`, `SelectModeBar.test.tsx`
- `src/widgets/folder-form/ui/FolderForm.test.tsx`

**Patterns:** D for DnD (`DeckTree`, `ReorderableList`); B for the rest.

**Per-component contract (read each first):**
- `DeckTree` — Pattern D verbatim: renders decks in `order`; tap → `onOpen(id)`; expand control → `onToggle(id)`; `selectMode` shows selection affordance and taps route to `onRequestSelect`/`onToggleSelect`; `drop`/`settling` render the drop indicator without crashing. Cards drive due counts — pass a `makeCard` with a matching `deckId` and assert the due badge.
- `ReorderableList` — renders each child row; the drag handle is present per row; assert the reorder callback wiring and that rows render in the given order (not full drag physics).
- `ContentRows` — renders a row per card with front/back; row actions (edit/flag/delete) fire their callbacks; **empty** deck renders the empty copy.
- `editor-fields` — renders the front/back/hint/tip inputs; typing fires the change callbacks; validation/error text where present.
- `CardBrowser` — lists cards; search/filter narrows the list; **empty** and no-results states; selecting a card fires its handler.
- `SelectModeBar` — shows the selected count; bulk actions fire their callbacks; disabled when nothing selected.
- `FolderForm` — renders name/icon/color fields prefilled from props; submit fires `onSubmit` with the edited values; blank name blocks submit; cancel fires `onCancel`.

- [ ] **Step 1:** Read each component; note store usage (expected: none — all prop-driven).
- [ ] **Step 2:** Write `DeckTree.test.tsx` (Pattern D verbatim) first.
- [ ] **Step 3:** Run it — expect PASS.
- [ ] **Step 4:** Repeat for the remaining 6.
- [ ] **Step 5:** Verify batch + commit.

```bash
npx vitest run src/widgets/deck-tree/ui/DeckTree.test.tsx src/widgets/content-editor/ui/ReorderableList.test.tsx src/widgets/content-editor/ui/ContentRows.test.tsx src/widgets/content-editor/ui/editor-fields.test.tsx src/widgets/content-editor/ui/CardBrowser.test.tsx src/widgets/content-editor/ui/SelectModeBar.test.tsx src/widgets/folder-form/ui/FolderForm.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/widgets/deck-tree/ui/DeckTree.test.tsx src/widgets/content-editor/ui/*.test.tsx src/widgets/folder-form/ui/FolderForm.test.tsx
git add src/widgets/deck-tree/ui/DeckTree.test.tsx src/widgets/content-editor/ui src/widgets/folder-form/ui/FolderForm.test.tsx
git commit -m "test: cover deck-tree, content-editor & folder-form widgets"
```

---

### Task 9: widgets — study-session shell & quiz sheet (10 components)

**Files:**
- `src/widgets/study-session/ui/StudyDeck.test.tsx`, `GearSheet.test.tsx`, `QuickActionRows.test.tsx`, `QuickActionsSheet.test.tsx`, `SheetSection.test.tsx`, `ToggleRow.test.tsx`, `CompletionOverlay.test.tsx`, `ModeSheet.test.tsx`, `InStudyEditor.test.tsx`
- `src/widgets/quiz/ui/QuizOptionsSheet.test.tsx`

**Patterns:** C for sheets/overlays (`GearSheet`, `QuickActionsSheet`, `ModeSheet`, `CompletionOverlay`, `QuizOptionsSheet`); B for rows/controls (`QuickActionRows`, `SheetSection`, `ToggleRow`, `InStudyEditor`, `StudyDeck`).

**Per-component contract (read each first):**
- `StudyDeck` — renders the current card stack; prop-driven; the grade/advance controls fire their callbacks; **empty**/completed state where present.
- `GearSheet` / `QuickActionsSheet` / `ModeSheet` — open into a portal; each option/toggle fires its callback; the current mode/setting is marked; Escape/dismiss closes.
- `QuickActionRows` — renders each action row; taps fire handlers; disabled rows are inert.
- `SheetSection` — renders heading + children in the section slots.
- `ToggleRow` — renders a `role="switch"`/checkbox with its label; toggling fires `onChange` and reflects `aria-checked`; disabled suppresses it.
- `CompletionOverlay` — renders the session summary (counts) and the primary action; the action fires its callback.
- `InStudyEditor` — renders the editable card fields; save fires the change callback; cancel/close discards.
- `QuizOptionsSheet` — open lists quiz options; selecting fires the callback; the current option is marked; dismiss closes.

- [ ] **Step 1:** Read each component; confirm props (expected prop-driven) and sheet composition.
- [ ] **Step 2–4:** Write + run each file (matched pattern + contract), expect PASS.
- [ ] **Step 5:** Verify batch + commit.

```bash
npx vitest run src/widgets/study-session/ui/StudyDeck.test.tsx src/widgets/study-session/ui/GearSheet.test.tsx src/widgets/study-session/ui/QuickActionRows.test.tsx src/widgets/study-session/ui/QuickActionsSheet.test.tsx src/widgets/study-session/ui/SheetSection.test.tsx src/widgets/study-session/ui/ToggleRow.test.tsx src/widgets/study-session/ui/CompletionOverlay.test.tsx src/widgets/study-session/ui/ModeSheet.test.tsx src/widgets/study-session/ui/InStudyEditor.test.tsx src/widgets/quiz/ui/QuizOptionsSheet.test.tsx
npm run typecheck && npm run lint
npx prettier --write src/widgets/study-session/ui/*.test.tsx src/widgets/quiz/ui/QuizOptionsSheet.test.tsx
git add src/widgets/study-session/ui src/widgets/quiz/ui/QuizOptionsSheet.test.tsx
git commit -m "test: cover study-session shell & quiz options sheet"
```

---

### Task 10: widgets — study faces (fixtures + 7 faces)

**Files:**
- Create: `src/widgets/study-session/ui/faces/face-fixtures.ts`
- Test: `src/widgets/study-session/ui/faces/CardFace.test.tsx`, `PromptFace.test.tsx`, `AnswerFace.test.tsx`, `BlurFace.test.tsx`, `TypeFace.test.tsx`, `InitialsFace.test.tsx`, `RebuildFace.test.tsx`

**Interfaces:**
- Consumes: `makeCard` (`@/entities/card`), `StudyCard` + `FaceProps` (`../../model/types`, `./types`).
- Produces: `makeStudyCard(overrides?): StudyCard`, `makeFaceProps(overrides?): FaceProps`.

**Patterns:** E (i18n face). `face-fixtures.ts` is a widget-layer file importing `@/entities/card` — allowed (widget → entities).

- [ ] **Step 1: Write the fixtures**

```tsx
// src/widgets/study-session/ui/faces/face-fixtures.ts
import { makeCard } from '@/entities/card'
import type { StudyCard } from '../../model/types'
import type { FaceProps } from './types'

export function makeStudyCard(overrides: Partial<StudyCard> = {}): StudyCard {
  return {
    card: makeCard({
      id: 'c1',
      createdAt: new Date(0).toISOString(),
      deckId: 'd1',
      front: 'Ping',
      back: 'Pong answer here',
    }),
    deckName: 'Forum',
    deckPath: 'Forum',
    ...overrides,
  }
}

export function makeFaceProps(overrides: Partial<FaceProps> = {}): FaceProps {
  return {
    card: makeStudyCard(),
    mode: 'blur',
    prompt: 'Ping',
    answer: 'Pong answer here',
    canSpeak: false,
    wordSpaces: false,
    typeInitialsOnly: false,
    active: true,
    onSpeak: () => {},
    onFlip: () => {},
    onRevealInPlace: () => {},
    onHideInPlace: () => {},
    onChangeMode: () => {},
    onOpenGear: () => {},
    ...overrides,
  }
}
```

- [ ] **Step 2:** Typecheck the fixture: `npm run typecheck` — expect no errors (confirms `FaceProps`/`StudyCard` shape). If `StudyCard.card` requires more fields, add them via `makeCard` options.

**Per-face contract (read each first — every face renders inside `CardFace`):**
- `CardFace` — renders the prompt/answer chrome, the speak control when `canSpeak`, flag indicator when `card.card.flagged`, and the gear control (`onOpenGear`); footer slot renders; back/flip control fires `onFlip`.
- `PromptFace` — renders the prompt; flip control → `onFlip`.
- `AnswerFace` — renders the full answer; flip/back control works; speak fires `onSpeak(answer)` when `canSpeak`.
- `BlurFace` (`mode: 'blur'`) — answer starts blurred; reveal control unblurs (or fires `onRevealInPlace`); hint renders when present.
- `TypeFace` (`mode: 'type'`) — renders a typing input; typing + submit checks the answer; correct vs incorrect feedback.
- `InitialsFace` (`mode: 'initials'`) — Pattern E verbatim: words masked to initials with per-word reveal buttons; the aid button toggles show-words/show-initials.
- `RebuildFace` — renders the rebuild interaction; assembling the answer fires the completion callback; reset works.

- [ ] **Step 3:** Write `InitialsFace.test.tsx` (Pattern E verbatim).
- [ ] **Step 4:** Run it — expect PASS.
- [ ] **Step 5:** Repeat Steps 3–4 for `CardFace`, `PromptFace`, `AnswerFace`, `BlurFace`, `TypeFace`, `RebuildFace` (set `mode` to match each face).
- [ ] **Step 6:** Verify batch + commit.

```bash
npx vitest run src/widgets/study-session/ui/faces/
npm run typecheck && npm run lint
npx prettier --write src/widgets/study-session/ui/faces/face-fixtures.ts src/widgets/study-session/ui/faces/*.test.tsx
git add src/widgets/study-session/ui/faces
git commit -m "test: cover study-session card faces"
```

---

### Task 11: Final full-suite verification

**Files:** none (verification only).

- [ ] **Step 1:** Run the whole suite: `npm run test` — expect all green (existing ~45 + ~75 new + harness).
- [ ] **Step 2:** Run `npm run typecheck && npm run lint` — expect no errors.
- [ ] **Step 3:** Optional coverage snapshot: `npm run test:cov` — confirm `shared/ui` and `widgets` coverage rose.
- [ ] **Step 4:** If any component test could only pass by asserting apparently-wrong output, list those as suspected bugs in the final report (do not fix here — characterization only).

## Self-Review

- **Spec coverage:** harness (Task 1) ✓; primitives 13 (Tasks 2–4) ✓; shared/ui 30 (Tasks 5–6) ✓; widgets 32 (Tasks 7–10) ✓; `face-fixtures` ✓; `ResizeObserver` stub ✓; `renderWithStores` correctly dropped (YAGNI). Total new tests = 4+5+4+17+13+8+7+10+7 = 75 ✓.
- **Placeholder scan:** worked examples (Patterns A–E, harness, fixtures) are complete runnable code; per-component contracts are concrete requirements, not TODOs. Component-specific assertions are derived by reading each component — inherent to characterization testing, not a placeholder.
- **Type consistency:** `renderWithProviders`, `makeFaceProps`, `makeStudyCard`, `makeDeck`, `makeCard`, and `StudyMode` values match their verified signatures throughout.
