# UI Component Test Suite — Design

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan
**Scope:** Behavior tests for every untested UI primitive, shared component, and widget (~75 components).

## Goal

Bring the ~75 currently-untested UI components under colocated `*.test.tsx` behavior
tests, deep enough to exercise every real state each component has, following the
repo's established Testing-Library house style. These are **characterization tests**
for existing components (implement-first, tests-after) — not TDD.

## Context (current state)

- **Stack:** Vitest 4 + jsdom, `@testing-library/react` 16, `@testing-library/user-event` 14,
  `@testing-library/jest-dom` 6. Config in `vite.config.ts`: `globals: false`,
  `setupFiles: ['./src/shared/test/setup.ts']`, `css: false`.
- **~45 component tests already exist** and share one consistent style (import from
  `vitest`, `afterEach(cleanup)`, `user-event`, query by role/accessible name).
- **Existing helpers:** `src/shared/test/setup.ts` (stubs Pointer Capture + `localStorage`),
  `src/shared/test/sticky-header.ts` (`fakeStickyHeader`), `src/shared/test/repository-contract.ts`.
- **jsdom gaps are minimal:** no `matchMedia` / `IntersectionObserver` / `navigator.onLine` /
  `scrollIntoView` usage in `shared/ui` or `widgets`. One `ResizeObserver` (in
  `CardFace`), already self-guarded.
- **Widgets are prop-driven:** e.g. `DeckTree` takes all data via props. Only a few
  components consume entity stores; the pattern for those is `InMemoryRepository` +
  entity `StoreContext` (see `src/pages/settings/ui/SettingsPage.test.tsx`).
- **No shared render helper exists** — provider wrappers are inlined per test.

## Non-goals

- No pages (already largely covered), no e2e / visual-regression, no Storybook.
- **No behavior changes.** Tests are characterization-only. If a test surfaces a real
  bug, flag it for a separate fix — never encode the bug as "expected" or paper over it.
- No new third-party test deps.
- Do not re-test Base-UI / shadcn internals — test **our** wiring (variants, callbacks,
  a11y attributes, composed states), not the underlying library's behavior.

## Approach

**Shared harness + bottom-up batches**, each batch ending on a green
`typecheck && lint && test`.

### 1. House conventions (fixed, matches existing tests)

- Import `describe/it/expect/vi` from `vitest`; `afterEach(cleanup)`.
- `user-event` over `fireEvent`.
- Query by **role + accessible name**; never test-ids.
- Assert a11y attributes (`role`, `aria-checked`, `aria-pressed`, `aria-disabled`,
  `aria-expanded`) and keyboard behavior where applicable.
- Colocated `X.test.tsx` next to the component.
- `import type` for type-only imports (`verbatimModuleSyntax`).
- Prettier: no semicolons, single quotes, trailing-comma `all`, printWidth 100.

### 2. New shared harness (`src/shared/test/`)

Two hard constraints discovered during planning shape this:

- **FSD boundaries exempt only test files** (`boundaries/ignore: ['**/*.{test,spec}.{ts,tsx}']`).
  A `*.test.tsx` may import any layer, but a **non-test** helper under `shared/test/`
  may not import upward (`@/entities/*`, `@/widgets/*`) — that fails lint. So shared
  helpers stay shared-only; domain fixtures live in the layer that owns them.
- **No untested component consumes an entity store** (only `DeckContentEditor`, already
  tested). So `renderWithStores` is YAGNI and is **not** built.

Deliverables:

- **`src/shared/test/render-with-providers.tsx`** — `renderWithProviders(ui, opts?)`
  wrapping `I18nextProvider i18n={i18n}` + `MotionConfig reducedMotion="always"`
  (opt-out via `opts.reducedMotion`). Imports only `@/shared/*` + `motion/react`, so it
  is boundary-legal as a non-test file. Replaces the inlined wrapper across new tests.
- **`src/shared/test/setup.ts` addition** — a `ResizeObserver` stub so `CardFace`'s
  measured layout is exercisable under jsdom.
- **Colocated fixtures where needed** — e.g. a `makeFaceProps` builder for the study
  faces lives at `src/widgets/study-session/ui/faces/face-fixtures.ts` (widget→entities
  is allowed). Simple domain objects are built inline in the test, mirroring the existing
  `studyCard()` helper in `FlashcardsPanel.test.tsx`.

Keep the harness minimal (CLAUDE.md: avoid premature abstraction) — one render helper
plus a stub; fixtures only where reused.

### 3. "Deep — all real states each"

Per component, cover the applicable subset (a component only tests states it actually has):

- **Render / variants** — each variant/size/tone/orientation branch renders.
- **Interaction** — every callback fires with correct args via `user-event`;
  `disabled` / `loading` suppresses it.
- **A11y** — role, accessible name, aria-state, and keyboard (Enter/Space/Escape/arrows)
  and focus/portal behavior where relevant.
- **Content states** — `loading`, `empty`, `error`, and **`offline`** for components that
  render them; omitted where the component has none (a pure `Badge` tests its variants —
  that is "all its states").

### 4. Tricky-surface playbook

- **Portals** (Base-UI `Sheet`, `ActionSheet`, `Drawer`, `dropdown-menu`, `alert-dialog`,
  `Combobox`, `PromptSheet`, `ConfirmDialog`): open via trigger, assert with `findByRole`
  (portal-aware), assert Escape / overlay-dismiss and focus return.
- **Gestures / DnD** (`SwipeRow`, `swipe-actions`, `ReorderableList`, `DeckTree`,
  `DropIndicator`): pointer capture already stubbed. Assert **wiring** — handlers/config
  passed through, revealed actions on swipe intent, `order`-sorted output, drop-intent
  rendering — rather than simulating full drag physics.
- **Motion** (entrance/exit via `motion`): `reducedMotion="always"` so animations don't
  gate assertions.
- **Store-backed widgets**: `renderWithStores` + `InMemoryRepository`; seed via fixtures.

### 5. Batches (bottom-up; each ends green)

1. **Harness** — `render-with-providers`, `render-with-stores`, `fixtures`, `ResizeObserver`
   stub. Prove it by converting one existing inline test (optional) and adding one new test.
2. **Primitives (13):** `alert-dialog`, `badge`, `button`, `card`, `drawer`,
   `dropdown-menu`, `empty`, `field`, `icon-button`, `input`, `progress`, `textarea`,
   `toggle-group`.
3. **shared/ui components (30):** `PromptSheet`, `ConfirmDialog`, `select-actions`,
   `GlassCard`, `SettingsSection`, `PasswordField`, `DropIndicator`, `ActionSheet`,
   `Sheet`, `SpeedDial`, `ScreenHeader`, `SelectDot`, `swipe-actions`, `TierPips`,
   `Combobox`, `SelectToolbar`, `Chip`, `ImportRow`, `AppScreen`, `SortControl`,
   `FolderGlyph`, `IconColorRow`, `CollectionPreview`, `EditableTitle`, `BadgeMedallion`,
   `SwipeRow`, `StickyBar`, `CardMaturityOverview`, `OverflowMenuButton`, `DeckCover`.
4. **widgets (32):**
   - bottom-nav: `AppNav`
   - achievement-list: `AchievementGrid`, `AchievementsSection`
   - badge-list: `NextMilestoneCard`, `BadgeGrid`, `BadgesSection`
   - deck-tree: `DeckTree`
   - quiz: `QuizOptionsSheet`
   - folder-form: `FolderForm`
   - threshold: `AuthLogo`, `Threshold`
   - content-editor: `editor-fields`, `ContentRows`, `ReorderableList`, `CardBrowser`,
     `SelectModeBar`
   - study-session: `StudyDeck`, `GearSheet`, `QuickActionRows`, `QuickActionsSheet`,
     `SheetSection`, `ToggleRow`, `CompletionOverlay`, `ModeSheet`, `InStudyEditor`
   - study-session/faces: `CardFace`, `RebuildFace`, `TypeFace`, `AnswerFace`,
     `InitialsFace`, `BlurFace`, `PromptFace`

### 6. Verification

Each batch closes with `npm run typecheck && npm run lint && npm run test` green
(`superpowers:verification-before-completion`). `web-design-guidelines` informs the
a11y assertions. Format only touched files (`npx prettier --write <files>`).

## Risks / open questions

- **Hidden store coupling:** a widget assumed prop-driven may pull from a store/context.
  Mitigation: check each component's imports before writing its test; escalate to
  `renderWithStores` only when needed.
- **Portal query flakiness:** use `findBy*` and assert on `document.body`, not `container`.
- **Characterization traps:** a component may have a latent bug; per non-goals, flag it
  rather than bake it into an assertion.
- **Batch 4 is the heaviest** (study-session faces + content-editor are the most stateful);
  it may itself split into sub-batches during planning.

## Deliverables

- `src/shared/test/render-with-providers.tsx` (shared-only imports; boundary-legal).
- `ResizeObserver` stub in `src/shared/test/setup.ts`.
- `src/widgets/study-session/ui/faces/face-fixtures.ts` (`makeFaceProps`).
- 75 new colocated `*.test.tsx` files.
- Full suite green; no component behavior changed.
