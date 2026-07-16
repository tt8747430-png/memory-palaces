# Return to React — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Mindscape's Angular View layer with React 19 + shadcn + React Router 8, keeping the
≈7,600-line framework-agnostic clean-architecture core intact.

**Architecture:** Feature areas × Clean Architecture × MVVM. The domain core, entity models, CQRS-lite
commands, and the `Repository<T>` port/adapter seam are copied across unchanged — they contain no
framework. Stores stay framework-agnostic classes whose only Angular dependency (`signal`) is swapped
for a ~30-line observable, bound to React via `useSyncExternalStore`. DI becomes a composition root
plus one `ServicesProvider` context. ViewModels become hooks, governed by the unchanged no-middle-man
rule.

**Tech Stack:** React 19.2 · Vite 8 (Rolldown) · TypeScript 6 strict · **React Router 8** (data mode) ·
shadcn/ui (`base` variant → Base UI) · Tailwind v4 · RxDB 17 (Dexie/IndexedDB) · react-i18next (typed
keys) · vite-plugin-pwa (`generateSW`, `main`'s config) · `@dnd-kit` · lucide-react · Vitest 4 + jsdom +
Testing Library · axe-core

**Source spec:** [`../specs/2026-07-16-return-to-react-design.md`](../specs/2026-07-16-return-to-react-design.md)

## Scope note — why this is one document with one executable phase

This plan is the **single authoritative source of truth**, superseding the decision content of ADRs
0001–0009 and the four prior specs (Part A). It carries the complete target structure (Part B) and the
full ten-phase sequence (Part C).

**Only P0 is written at executable step granularity (Part D).** P1–P9 are scoped, sequenced, and given
file lists and definitions of done, but each earns its own plan document before work starts. This is
deliberate, not an omission: writing bite-sized steps with complete code for ~23,000 lines of View
layer up front would mean inventing ~10,000 lines of code against pages nobody has re-read yet. That
is fabrication, not planning. P0 and P1 will teach us things that change P2–P9.

**The tests come back — this is part of the economics.** `main` carries **104 RTL test files**
(`*.test.{ts,tsx}`); the Angular tree kept only 64 specs and its port tracker admits the shortfall.
Because the target stack is again React + Testing Library, those test bodies largely survive — only
import paths and the DI wrapper (`ServicesProvider` + `createTestServices`) change. Every phase
therefore **starts by porting its area's tests from `main`** (renamed `.test.tsx` → `.spec.tsx`);
they are the executable form of that phase's parity bar, not an afterthought.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Zero legacy in code.** Latest stable deps. No polyfills, no fallback branches, no deprecated APIs,
  no compat shims.
- **Persisted data is pre-release.** No RxDB migrations. All schemas are `version: 0` (already true —
  ADR-0005 collapsed them). The backwards-compat carve-out goes live at launch, not now.
- **The one boundary rule:** `shared/` must never import from a feature area. Lint-enforced.
- **Cross-area imports go through barrels** (`@/decks`), intra-area imports stay relative. Barrels
  export only what other areas consume.
- **All writes go through commands.** One use-case per file. Bulk actions are their own commands, never
  a loop at the caller. Domain rules live in the command, not the caller.
- **`start()` is called only at the composition root.** Never from a component.
- **ViewModels are earned.** A hook that only forwards to stores and commands is a Middle Man — delete
  it and let the component read the store directly.
- **Semantic tokens only.** No raw hex. No per-component `dark:`. Dark mode is one `data-theme`
  attribute.
- **No manual `z-index` on shadcn overlays** — they manage their own stacking.
- **Every drawer is the shared `Drawer`** (our wrapper over the Base UI primitive, same name by
  design, `VirtualKeyboardProvider` baked in — ADR-0010). Hand-made drawers are banned; that ban is
  what keeps every drawer keyboard-aware. The glossary word is **Drawer** — ported `*Sheet` symbols
  rename mechanically.
- **The token scale is rem** (ADR-0011). Never a px font size; only hairlines, shadows, and `env()`
  insets stay px.
- **Tailwind for layout and spacing in JSX; nothing else.** Components come from shadcn and are styled
  through its CSS variables, fed by `src/styles/tokens.css`.
- **Every surface handles loading, error, empty, and offline.** Not just the happy path.
- **Every routed area sits under a route `ErrorBoundary`** (React Router data mode). A thrown render
  is a recoverable in-app state, never a white screen. The root boundary lands in P0 (Task 12);
  area-level boundaries are added where a phase's pages can fail independently.
- **Accessibility is verified, not assumed.** Every page gets an axe smoke spec via
  `expectNoA11yViolations` (axe-core, Task 2) as part of its phase, and each phase's close includes a
  manual WCAG AA pass of its pages — this restores ADR-0006's per-page AXE gate, which an earlier
  draft of this plan dropped.
- **`prefers-reduced-motion` and safe areas are honoured.**
- **TypeScript strict** with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
  `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax` + `isolatedModules` (use `import type`).
- **Prettier:** no semicolons, single quotes, trailing-comma `all`, printWidth 100.
- **Tests:** colocated `*.spec.ts(x)`, Vitest + jsdom, **`globals: false`** (import `describe`/`it`/
  `expect` from `vitest`), `fake-indexeddb`, setup in `src/test-setup.ts`. Prefer testing a VM hook or
  a command over rendering a component. **Each phase ports its area's RTL tests from `main` first**
  (rename `.test.tsx` → `.spec.tsx`, rewrite imports, swap the DI wrapper to `ServicesProvider` +
  `createTestServices`); the vitest `include` accepts both suffixes so a half-ported area still runs.
- **Selectors/naming:** `ms-` prefix is retired with Angular. React components are PascalCase files.
- **Ubiquitous language** (`docs/UBIQUITOUS_LANGUAGE.md`) is unchanged and still names folders, symbols,
  and commits: Deck, Card, Question, Review, Study session, Learner. "Session" = auth, never a study
  pass. `known` (SRS status) ≠ Memorized (manual flag). No "palace/room/locus".
- **Verification per phase:** `npm run typecheck && npm run lint && npm run test && npm run build`.
  This is a **phase-end gate, not a per-commit one** — intermediate commits may be red while a
  refactor is mid-flight (decision 2026-07-17: refactor quality over continuous buildability; there
  is deliberately **no CI**). The only per-commit enforcement is formatting, via Husky +
  lint-staged (Prettier).
- **Two dependency ceilings are deliberate. Do not "update to latest":**
  - **`typescript: ~6.0.3`** — 7.0.2 is `latest`, but `typescript-eslint@8.64.0` caps at
    `typescript <6.1.0`. TS7 breaks `npm run lint`. Tilde, not caret, so 6.1 can't sneak in.
  - **`react-router: ^8.2.0`** — v8, not v7. Data mode, `createBrowserRouter`, `lazy`, and
    `middleware` all survive; `middleware` is now stable. `RouterProvider` comes from
    `react-router/dom`.
- **After adding any shadcn component** (shadcn's own audit checklist): verify named-vs-default
  imports, that every dependency installed, then typecheck and lint. Read the generated file — do not
  assume the registry's composition is correct for our structure.

---

# Part A — Consolidated decisions

This part replaces the decision content of every prior ADR and spec. The originals stay on disk as
history, marked `Superseded by` this plan.

## A.1 Supersession map

| Prior doc                          | Fate under this plan                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ADR-0001 Angular styling           | **Superseded** → A.5 (Tailwind v4 + shadcn CSS vars fed by `tokens.css`)                                           |
| ADR-0002 Widget ownership matrix   | **Superseded** → A.4 (shadcn ownership matrix)                                                                     |
| ADR-0003 In-place migration        | **Superseded** → A.2, Part C (branch + worktree strategy)                                                          |
| ADR-0004 Feature areas             | **Survives**, with one correction → A.3 (the `progress/` area it specified never got built)                        |
| ADR-0005 Platform choices          | **Superseded** → A.6. Its RxDB-is-pre-release finding **survives and is load-bearing**                             |
| ADR-0006 Migration mechanics       | **Superseded** → Part C                                                                                            |
| ADR-0007 Hand-rolled M3 nav        | **Fully superseded** → A.4 (nav stays custom; `main`'s glass pill returns, M3 geometry dropped — grill 2026-07-17) |
| ADR-0008 MVVM / no-middle-man      | **Rule survives verbatim, form changes** → A.7 (VM is a hook)                                                      |
| ADR-0009 PrimeNG headless overlays | **Superseded and deleted entirely** → A.4 (shadcn `Drawer` removes the bridge and its wart)                        |
| Spec 07-10 study settings          | **Behaviour survives** → binds P1 (Studying section) and P3. Already in `main`.                                    |
| Spec 07-13 flashcard modes         | **Behaviour survives** → binds P3. Already in `main`.                                                              |
| Spec 07-14 keyboard elevation      | **Behaviour survives, mechanism under review** → binds P1/P3. See A.4.                                             |
| Spec 07-16 Angular MVVM cleanup    | **Superseded** → A.7. Its substance (VMs, bulk commands, barrels, store bootstrap) is kept.                        |

## A.2 The two frozen references

Neither reference lives in the working tree. Both are read from git.

| Reference          | Branch                                | Authority                                                   | Command                                                                    |
| ------------------ | ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Original React app | `main` (frozen at `87e68f4`, 0 since) | **Behavioural — the parity bar for every area**             | `git worktree add ../mindscape-ref main && npm i && npm run dev`           |
| Angular port       | `angular-migration` (at `408267a`)    | **Structural only** — area layout, bulk commands, VM shapes | `git worktree add ../mindscape-ng angular-migration && npm i && npm start` |

**`main` is the behavioural bar even for areas Angular already ported.** The Angular tree is not a
behavioural authority: the port tracker documents unreconciled deviations (sticky-header elevation
simplified to a boolean where React ramps 0–1 over 16px; drag-and-drop never ported; long-press action
sheet removed), and **`[~]` means "ported, _verification pending_"** — which is most of its rows.
Treating it as the bar would canonise unverified behaviour.

Where the two disagree, **`main` wins and the deviation is recorded in that phase's plan.** A
deviation worth keeping is raised as a design decision, never smuggled in as a port.

## A.3 Structure — feature areas (ADR-0004, corrected)

ADR-0004 specified a `progress/` area. **It was never built.** On disk the areas are `auth decks
import notifications practice settings shared shell study`, with `ProgressStore` living inside
`study/` and every progress page unported.

**Correction, applied in P0:** `progress/` is created as ADR-0004 specified.

- `progress/` owns `ProgressStore`, the progress model, the XP/streak/reward commands, and the
  profile, streak, badges, and achievements pages.
- `study/` keeps the SRS engine only — review commands, the session machine, the study session pages
  and card faces. This matches ADR-0007's description of it: _"`study/` has no pages at all (it is the
  SRS engine)."_
- `auth/` keeps `SessionStore` and `ProfileStore` (identity: name, avatar) plus the auth pages. The
  profile **page** lives in `progress/` and reads `ProfileStore` from `auth/` through its barrel — the
  page is the progress hub; the store is an identity entity. This is a normal cross-area read.

## A.4 UI ownership — shadcn

**shadcn `base` variant (Base UI primitives), not `radix`.** Verified from the registry source rather
than the docs prose, because the two disagree and the difference is load-bearing:

| Variant           | `ui/drawer.tsx` imports                                             |
| ----------------- | ------------------------------------------------------------------- |
| **`base`** ← ours | `import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"` |
| `radix` (default) | `import { Drawer as DrawerPrimitive } from "vaul"`                  |

Both variants ship. **radix is the CLI default**, and the shadcn MCP server reports `@shadcn/drawer`'s
dependency as `vaul` for that reason — so `--base base` is what makes the Base UI claim true, not
shadcn having migrated wholesale. The docs sentence _"the drawer component now uses Base UI instead of
Vaul"_ describes the `base` variant only.

The choice is decided by the bottom sheet, this app's most important overlay: Base UI's `Drawer`
extends `Dialog` with gesture swipe-to-dismiss, snap points, nested drawers, and virtual-keyboard
awareness, and its generated component carries a `DrawerContext` exposing `hasSnapPoints`,
`swipeDirection`, and `showSwipeHandle`. All 22 components this app needs were confirmed present in
the `base` variant.

| Category                | Was (ADR-0002/0009)            | Now                                                                  |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------- |
| Bottom / action sheets  | PrimeNG `Drawer` headless      | shadcn **`Drawer`** (`swipeDirection="down"`)                        |
| Dialogs                 | PrimeNG `Dialog` headless      | shadcn **`Dialog`**                                                  |
| Confirmations           | `ms-confirm-dialog`            | shadcn **`AlertDialog`**                                             |
| Menus / popovers        | PrimeNG `Menu` / `Popover`     | shadcn **`DropdownMenu`** / **`Popover`**                            |
| Toasts                  | PrimeNG `Toast`                | **`sonner`**                                                         |
| Form inputs             | Material form-field suite      | shadcn **`FieldGroup`/`Field`/`Input`/`Select`/`Switch`/`Textarea`** |
| Buttons                 | `MatButton`                    | shadcn **`Button`**                                                  |
| Segmented control       | `MatButtonToggle`              | shadcn **`ToggleGroup`**                                             |
| Cards                   | `MatCard`                      | shadcn **`Card`**                                                    |
| Progress / meters       | PrimeNG `ProgressBar` / `Knob` | shadcn **`Progress`**                                                |
| Empty states            | custom `EmptyState`            | shadcn **`Empty`**                                                   |
| Loading                 | custom                         | shadcn **`Skeleton`** / **`Spinner`**                                |
| Chips / badges          | custom `Chip`                  | shadcn **`Badge`**                                                   |
| Avatar                  | custom `Avatar`                | shadcn **`Avatar`** (+ required `AvatarFallback`)                    |
| Combobox                | custom                         | shadcn **`Combobox`**                                                |
| Icons                   | `lucide-angular`               | **`lucide-react`** (same glyph set)                                  |
| Deck tree drag-drop     | PrimeNG `Tree` _(never built)_ | **`@dnd-kit`** — built once, in P1                                   |
| **Swipeable list rows** | stays custom                   | **stays custom** — no library ships this                             |
| **Bottom navigation**   | hand-rolled to M3              | **stays custom** — see below                                         |
| **Speed dial**          | custom                         | **stays custom**                                                     |

### What shadcn deletes

- **ADR-0009 dies entirely.** Its ~80-line PrimeNG bridge and the `SHEET_MOTION_MS`-coupled-to-CSS
  wart it called _"the one genuine wart"_ existed only because in PrimeNG _"imperative-with-result and
  headless don't come in the same box."_ Base UI's `Drawer` is headless by construction.
- **Both overlay-stacking contracts die.** ADR-0002's CDK-vs-PrimeNG stack and ADR-0009's `zIndex`
  ordering in `app.config.ts` are obsolete. shadcn overlays manage their own stacking; manual
  `z-index` on them is a rule violation. `--ms-z-nav` survives for the hand-rolled nav only.

### The Drawer contract (ADR-0010)

The bugs the old mechanism shipped — flicker (the JS lift raced iOS's caret-reveal pan) and sheets
that never lifted (the lift was opt-in per sheet) — are eliminated structurally, not patched:

- **One shared `Drawer`, and it is the only way to build one.** A wrapper over the Base UI
  primitive of the same name (deliberate — the glossary word is **Drawer**), with
  **`Drawer.VirtualKeyboardProvider` baked into its anatomy**, so every drawer is keyboard-aware by
  construction. Hand-made drawers are banned.
- **Snap points are first-class:** the `Drawer` API exposes Base UI `snapPoints`; tall surfaces
  (content > ~60dvh: content editor, in-study editor, card filter) ship a half ↔ full detent pair
  in their phase. Short drawers stay at content height. Every detent is a designed, verified state.
- **Confirmed deletion** (still smoke-checked on device in P1): `use-drag-to-dismiss.ts` — the
  primitive ships gesture dismiss. `useKeyboardPin` is reviewed under the same ADR before any port.
- **Full-page keyboard reachability (ADR-0010 amendment):** a shell `KeyboardInsetProvider`
  publishes `--kb-inset` from `visualViewport`; `AppScreen`'s scroll region consumes it as
  `padding-bottom` + `scroll-padding-bottom`, so every page gains exactly keyboard-height of
  scroll room while typing — controls under the keyboard are reached by scrolling, never by
  lifting. `main`'s `useKeyboardInset` is the reviewed starting point (measurement kept, consumer
  changed from transform to padding — transforms stay banned). Form pages top-align content where
  possible; centered forms use overflow-safe centering (`margin-block: auto`, never bare
  `justify-content: center`, which clips its overflow at the top). Verified 2026-07-17: WebKit has
  never shipped `interactive-widget`, so the meta is iOS-inert and this JS mechanism is the only
  cross-platform fix; the meta stays `resizes-visual` for one uniform behavior on both platforms.
- **Documented fallback:** if P1's on-device check still shows keyboard jank, flip the meta tag to
  `interactive-widget=resizes-content` — one line, recorded in ADR-0010. The custom lift code does
  not come back either way.

### The bottom nav — `main`'s glass pill returns; ADR-0007 is fully superseded

_(Decided in the 2026-07-17 grilling session.)_ ADR-0007 rebuilt the nav to the Material 3 spec
(80px bar, 64×32 indicator) because _"the app is already Material M3 throughout."_ With Material
gone that rationale is void — and the M3 geometry was itself an **unraised deviation from the
behavioural bar**: `main`'s nav is a **floating glass pill** (16rem × 4rem, centered above the safe
area, primary-tinted `backdrop-blur` with a glow underlay and a spring-animated active indicator),
shown only on the two tab routes and persistent — no hide-on-scroll. The pill **is** the "soft
daylight-blue glass" brand identity (PRODUCT.md); the M3 bar reads as generic Material in an app
that no longer uses Material anywhere. **P1 ports the pill; the M3 geometry is dropped.**

The decision to hand-roll survives untouched — Base UI and shadcn still ship no mobile bottom nav,
and the hard parts (visibility, fixed placement, z-index, safe area) were always hand-written. The
ported pill sources colour from the semantic tokens, sizes in rem (ADR-0011), takes its layer from
`--ms-z-nav` (not `main`'s literal `z-[200]`/`z-1000000000` warts), and keeps ADR-0007's accepted
2-destination set (Home vs Profile; Study and Practice are deck-scoped flows with no deck-less
entry).

### Imperative overlays with a result

ADR-0008's shape is **kept**: a sheet that returns data exposes its own promise-returning `open*()`
co-located in the drawer's file (`main`'s `openMoveDeckSheet`, `openFolderSheet`,
`openCardFilterSheet` — renamed `open*Drawer` at port; the glossary word is Drawer). This is
load-bearing — the ported VM orchestration is written around `const result = await openMoveDeckSheet(…)`,
and preserving the shape preserves that code.

React needs a small host to make it work: a root-level `<OverlayHost>` plus an imperative
`openDrawer(Component, data): Promise<R>`. This is ~80 lines — the same size as the PrimeNG bridge it
replaces — but without the motion-timer wart, because Base UI reports its own close.

**It is not a Middle Man.** It does real work (mounts the component, owns the promise, resolves on
dismiss). A per-sheet wrapper class forwarding to it would be, and is still rejected.

## A.5 Styling

**The token architecture, as it actually exists in `tokens.css`** (an earlier draft of this plan —
and ADR-0001 — misnamed it "the `--sw-*` semantic palette"; that is wrong, and the error is inherited
from ADR-0001's prose):

- **Raw palette:** `--ms-*` (`--ms-navy-900`, `--ms-blue-500`, …) plus type/spacing/radius/shadow/z
  scales. (`main` spelled this prefix `--p-*`; the Angular port renamed it — the values are identical.)
- **Semantic layer:** _unprefixed_ tokens over the raws — `--surface`, `--text-primary`,
  `--text-heading`, `--primary`, `--secondary`, `--accent`, `--danger`, `--success`, `--warning`,
  `--favorite`, `--border`, `--divider`, `--ring`, `--input-bg`, … with a `[data-theme='dark']` block
  overriding them.
- **`--sw-*` is the swipe-action accent set only** — ten contrast-safe hues for swipe actions and
  settings chips (`.sw-tint`). It is not, and never was, the app's semantic palette.
- **`--bg` and `--bg-daylight` are `linear-gradient`/`radial-gradient` values, not colors.** They are
  applied as backgrounds on `#root`, and must **never** be mapped into `@theme` color slots —
  `bg-background/50` and `color-mix()` break on a gradient.

**The bridge to Tailwind/shadcn already exists and is ported, not invented:** `main`'s
`src/styles/theme.css` carries the full `@theme inline` block (`--color-background: var(--surface)`,
`--color-foreground: var(--text-primary)`, `--color-destructive: var(--danger)`, …), the base layer
(fixed `#root` with the gradient, no document scroll, focus ring, touch/selection rules), and the
utility classes (`.sw-tint`, `.bg-glass`, `.shadow-card`, `.pt-safe`/`.pb-safe`/`.pb-nav`, …). The
Angular port dropped this file; Task 3 restores it from `main` with the one mechanical rename
`--p-*` → `--ms-*`.

Rules:

- **Components** come from shadcn, styled **only** through its CSS variables, fed by the semantic
  layer via the restored `theme.css` bridge. shadcn init's generated default palette is deleted, not
  merged (Task 3).
- **Layout and spacing** come from Tailwind v4 utilities in JSX — nothing else.
- **Dark mode** is one `data-theme` attribute. No per-component `dark:`. No raw hex.
- **Component-scoped CSS** only for what neither expresses (e.g. a keyframe).
- Tailwind v4 is CSS-first: `@theme inline` lives in `theme.css`. There is no `tailwind.config.js`.
- shadcn's own rules bind: `gap-*` never `space-y-*`; `size-*` when width equals height; `truncate`
  shorthand; `cn()` for conditional classes; `data-icon` for icons in buttons with no sizing classes.
- **Fonts are self-hosted** (`@fontsource/lexend`), not fetched from Google Fonts. `main` imported
  the Google Fonts URL — an offline-first violation (first offline launch renders fallback type).
  Self-hosted woff2 falls inside the SW precache glob and works offline. The `--ms-font-sans` stack
  (`'Lexend', …`) is unchanged; `@fontsource/lexend`'s family name is exactly `Lexend`.
- **The token scale is rem (ADR-0011).** Type, spacing, radii, and the 430px column
  (→ `26.875rem`) all scale with the user's OS/browser text-size setting as one system — Task 3
  converts the carried-over values. Carve-outs stay px: 1px hairlines, shadow/blur offsets,
  `env()` insets. Never reintroduce a px font size.
- **Inputs render at ≥16px** (`--ms-text-title`), baked into the shared `Input`/`Textarea` in P1 —
  kills iOS focus auto-zoom without touching pinch-zoom (ADR-0010).
- **Warning re-hues to the gold band** (grill session 2026-07-17): the `--warning*` family keeps its
  lightness/chroma structure but moves hue ~70/49 → ~84, consistent with the rating gold and free of
  the amber/orange cast. Danger stays red; success stays green. AA re-checked in both themes.
- **Desktop scrollbars are thin and token-colored:** `scrollbar-width: thin; scrollbar-color:
var(--border) transparent`, scoped to `(pointer: fine)` — appended to `theme.css`. No webkit
  pseudo-element chrome; `.scrollbar-hide` stays reserved for carousels/chip rows.

## A.6 Platform

| Concern | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build   | **Vite 8.** Rolldown replaced esbuild+Rollup (10–30× faster builds, full plugin compat), which removes the only argument for Rsbuild/Rspack. React Router 8, Vitest, Tailwind v4, and shadcn all assume Vite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Router  | **React Router 8, data mode.** `createBrowserRouter` + `lazy` route modules + `middleware` for the auth gate (stable in v8, no `future` flag). Not framework mode — it drags in SSR machinery an offline-first PWA does not want. `RouterProvider` imports from `react-router/dom`; `react-router-dom` no longer exists.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Data    | **RxDB** (Dexie/IndexedDB), all schemas `version: 0`. Unchanged source of truth. **Boot requests `navigator.storage.persist()`** — the local DB is the only copy of the learner's data and eviction would be total loss; neither `main` nor the Angular tree ever asked. Multi-tab stays safe via RxDB's default `multiInstance` leader election (`createRxDatabase` keeps the default).                                                                                                                                                                                                                                                                                                                                    |
| i18n    | **react-i18next.** Transloco is Angular-only. **Runtime language switching is a hard requirement** (ADR-0005 revised `@angular/localize` away for exactly this); react-i18next does it natively. **`main`'s typed catalogue is ported, not the flattened JSON:** `src/shared/i18n/locales/en.ts` (`as const` + `AppResources`) plus `i18next.d.ts` (`CustomTypeOptions`) make every `t('…')` key compile-checked. Angular's `public/i18n/en.json` was derived from it; Task 11 diffs the key sets, merges Angular-era additions back into `en.ts`, then deletes the JSON.                                                                                                                                                   |
| PWA     | **`vite-plugin-pwa`**, **`generateSW` (the default)** — `main`'s exact plugin config, ported: `registerType: 'prompt'`, inline manifest, `cleanupOutdatedCaches`, `clientsClaim`. `useRegisterSW()` from `virtual:pwa-register/react` returns `{ needRefresh, offlineReady, updateServiceWorker }` — exactly the update-prompt requirement, and works identically under `generateSW`. **`injectManifest` (an earlier draft's choice) is reversed:** the SW only precaches the shell — the app has zero custom SW logic — so hand-authoring `src/sw.ts` + `workbox-precaching` is overhead over the config `main` already proved. **Serwist rejected** for the unchanged reason: no React hook, more work for less function. |
| Test    | **Vitest + jsdom + Testing Library**, `globals: false`. Vite owns `@/*`, so single-spec runs work directly — the Angular builder's alias-resolution caveat dies with it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Motion  | **`motion`** (`motion/react`). Not an inherited default: `main` uses it in **62 files**, and `useReducedMotion` + `MotionConfig` are how the repo satisfies CLAUDE.md's `prefers-reduced-motion` rule. **The Angular tree shipped no motion library at all** — a real parity gap, not a simplification, and another reason its `[~]` rows are not a behavioural bar. shadcn animates via Tailwind/CSS and does not replace this. **Between pages, routes animate via the View Transitions API** (RR8 `viewTransition` — ADR-0012; all three engines ship it, Safari 18+ is the zero-legacy floor); `motion` never crosses a route boundary.                                                                                 |
| DnD     | **`@dnd-kit`.** The one dependency revived from the original React app. Deck-tree reorder/reparent never reached Angular (ADR-0002 assigned it to PrimeNG `Tree`; never built), so P1 builds it once, properly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## A.7 MVVM — the ViewModel is a hook

Angular's VM is a class because per-component `providers` plus `computed` supply scoped DI and
reactivity for free. React has no scoped injector, so a VM class must be hand-bound to rendering —
`useSyncExternalStore` tracking per VM, maintained forever, returning nothing. React's per-component
unit of scoped state plus orchestration **is** a hook.

**ADR-0008's rules survive verbatim. Only the form changes.**

- **The ViewModel owns:** view state, derived read models (`useMemo`), and orchestration — command
  dispatch, toast/undo composition, confirm flows, navigation intents.
- **The View owns:** the JSX, plus presentation that never leaves it (icon sets, scroll-driven header
  elevation).
- **Navigation is exposed as intents** (`openDeck(id)`); JSX never carries route strings.
- **ViewModels are earned, not automatic.** _"Extract a ViewModel only when a page owns real derived
  state or multi-step orchestration. A class that merely forwards to stores and commands is a Middle
  Man — delete it and let the component read the store directly."_
- **Judge by body and by whether the logic is real — never by file size.** The three earned VMs
  (`deck-library`, `deck-questions`, `deck-content`) become three hooks. `quiz-session` and the two
  settings editors stay plain, for ADR-0008's reason: their rules already live tested in `quizReducer`
  and the `normalize*` functions. **If the domain logic is already extracted and tested, a ViewModel
  has nothing to hold.**
- **No pass-through wrapper services.** VMs inject real ones — toast, confirm, prompt, action sheet.
- **No command that only forwards to another.** "Unfile" is `moveDecks(store, ids, null, null)`.
- **Domain rules live in commands, not the VM.** "Favourite is a set, not a flip" lives in
  `setDecksFavorite`; `canReparent` filtering lives in `moveDecks`.

## A.8 Behavioural constraints inherited from prior specs

These bind their phases and must not be silently undone. All are already implemented in `main`.

- **Study settings are global app-wide preferences**, not deck-scoped, and live in a "Studying" section
  on the deck settings page. Swipe gestures map per-mode (Blur / Rebuild / Initials / Type) via a
  compact tabbed editor. _(Spec 07-10 → P1, P3, P6)_
- **Flip lifecycle:** Type and Rebuild must not inherit flipped state when switching modes — they open
  on the prompt face. Once solved they are not flippable, and no "tap to see the answer" badge shows.
  _(Spec 07-13 → P3)_
- **Card content scrolls** at arbitrary length; dragging inside Type mode's feedback box must scroll it,
  not swipe the card. _(Spec 07-13 → P3)_
- **The keyboard lifts only Drawers.** No full-page surface shrinks, floats, or translates — but a
  full page **gains scroll capacity** equal to the keyboard overlap (`--kb-inset`, ADR-0010
  amendment) so every control stays reachable by scrolling. _(Spec 07-14 → P1, P3, P4; mechanism
  **decided** — ADR-0010: Drawers lift via `VirtualKeyboardProvider`; pages scroll via the shell
  `KeyboardInsetProvider`; transform lifts stay banned.)_

---

# Part B — Target repo structure

Path alias: **`@/*` → `src/*`** (replacing `@app/*` → `src/app/*`). shadcn expects `@/`, and the `app/`
nesting level is a Next.js-ism that means nothing here. The rename is one mechanical pass over the
copied core (`@app/` → `@/`).

```text
mindscape/
├── components.json                  ← shadcn config (base variant, aliases below)
├── index.html
├── vite.config.ts                   ← react, tailwind, pwa(generateSW + manifest), alias @/,
│                                      vitest test block (via /// <reference types="vitest/config" />)
├── eslint.config.js                 ← + boundary rule: shared/ imports no feature area
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
├── public/                          ← main's set: pwa-192/512, maskable-512, apple-touch-icon,
│                                      favicon.svg, robots.txt. The webmanifest is generated by
│                                      vite-plugin-pwa; Angular-era public/icons/ + manifest.webmanifest
│                                      are deleted (Task 12). i18n/en.json dies in Task 11.
├── docs/
│   ├── adr/                         ← 0001–0009 marked Superseded; 0010–0012 written; 0013+ new
│   ├── CODE_STYLE.md  MOBILE_DESIGN.md  UBIQUITOUS_LANGUAGE.md
│   └── superpowers/{specs,plans}/
└── src/
    ├── main.tsx                     ← bootstraps: createServices() → <App/>
    ├── app.tsx                      ← <RouterProvider> + providers
    ├── routes.tsx                   ← createBrowserRouter, lazy per area, auth middleware
    ├── composition-root.ts          ← builds RxDB + repos + stores; start()s them. THE seam.
    ├── test-setup.ts                ← fake-indexeddb, jest-dom, localStorage shim (from main)
    │
    ├── styles/
    │   ├── index.css                ← @import fontsource-lexend, tailwindcss, tokens, theme
    │   ├── tokens.css               ← raw --ms-* palette + unprefixed semantic layer + --sw-*
    │   │                              swipe accents (carried over; --sw-* is swipe-only)
    │   └── theme.css                ← RESTORED FROM main (--p-* → --ms-*): the @theme inline
    │                                  bridge to shadcn/Tailwind, base layer, utilities
    │
    ├── shell/                       ← app chrome
    │   ├── services-provider.tsx    ← DI context + useServices()
    │   ├── root-layout.tsx
    │   ├── route-error-boundary.tsx ← useRouteError fallback; root route mounts it
    │   ├── keyboard-inset-provider.tsx ← publishes --kb-inset (ADR-0010 amendment); AppScreen
    │   │                              consumes it as scroll padding — pages scroll, never lift
    │   ├── app-nav.tsx              ← hand-rolled bottom nav (M3 geometry, shadcn tokens)
    │   ├── splash-overlay.tsx
    │   ├── update-prompt.tsx        ← useRegisterSW() (main has UpdatePrompt.tsx — port it)
    │   ├── theme-provider.tsx       ← data-theme
    │   └── notification-bridge.tsx
    │
    ├── shared/
    │   ├── domain/                  ← COPIED VERBATIM (2,886 lines, 18 spec files)
    │   │   ├── srs.ts  streak.ts  stats.ts  recall.ts  deck-tree.ts  order.ts
    │   │   ├── achievements.ts  badges.ts  naming.ts  entity.ts  shuffle.ts
    │   │   ├── clock.ts  gestures.ts  haptics.ts  drop-zone.ts  avatar.ts
    │   │   ├── content-transfer.ts  study-overview.ts  validation.ts
    │   │   ├── event-bus.ts  events.ts  speech.ts  download.ts
    │   │   ├── *.spec.ts             ← the behavioural anchor across the framework change
    │   │   └── index.ts
    │   ├── data/
    │   │   ├── base-repository.ts        ← Repository<T> port          (COPIED)
    │   │   ├── rxdb-repository.ts        ← production adapter          (COPIED)
    │   │   ├── rxdb-collection.ts        ←                             (COPIED)
    │   │   ├── in-memory-repository.ts   ← test adapter                (COPIED)
    │   │   ├── repository-contract.ts    ← shared adapter test suite   (COPIED)
    │   │   ├── database.ts               ← was app-database.ts; all schemas version: 0
    │   │   ├── observable.ts             ← NEW: replaces Angular signal
    │   │   ├── use-store.ts              ← NEW: useSyncExternalStore bridge
    │   │   ├── collection-store.ts       ← signal → Observable
    │   │   └── singleton-doc-store.ts    ← signal → Observable
    │   │       ⚠ event-bus.token.ts is DELETED (Angular DI); EventBus itself is
    │   │         pure TS in shared/domain/ and binds via Services
    │   ├── ui/                      ← shadcn components + custom primitives
    │   │   ├── button.tsx drawer.tsx dialog.tsx alert-dialog.tsx field.tsx
    │   │   ├── input.tsx select.tsx switch.tsx toggle-group.tsx card.tsx
    │   │   ├── badge.tsx avatar.tsx progress.tsx empty.tsx skeleton.tsx …
    │   │   ├── overlay-host.tsx     ← NEW: imperative openDrawer/openDialog → Promise
    │   │   ├── swipe-row.tsx        ← CUSTOM (no library ships it)
    │   │   ├── swipe-actions.tsx  select-dot.tsx  select-actions.tsx
    │   │   ├── select-toolbar.tsx  speed-dial.tsx  sticky-bar.tsx
    │   │   └── screen-header.tsx  app-screen.tsx
    │   ├── lib/
    │   │   ├── utils.ts             ← cn() — shadcn's `utils` alias target
    │   │   ├── use-optimistic-patch.ts ← PORTED FROM main + its test (CODE_STYLE §10 —
    │   │   │                          holds drops over RxDB's half-applied emissions)
    │   │   └── use-long-press.ts  use-keyboard-pin.ts  …
    │   ├── hooks/                   ← shadcn's `hooks` alias target
    │   ├── test/
    │   │   └── axe.ts               ← expectNoA11yViolations() (axe-core) — every page's smoke spec
    │   ├── config/                  ← CARRIED OVER from the Angular tree (pure TS, select-toolbar
    │   │   │                          has a colocated spec — stash in Task 1, restore in Task 6)
    │   │   └── routes.ts  constants.ts  swipe.ts  select-toolbar.ts  flashcard-swipe.ts
    │   └── i18n/                    ← PORTED FROM main: typed catalogue + CustomTypeOptions
    │       └── index.ts  locales/en.ts  i18next.d.ts
    │
    └── <area>/                      ← decks · practice · study · progress · auth
        │                              settings · notifications · import
        ├── model/                   ← COPIED VERBATIM. Types + factories/invariants. Pure TS.
        ├── data/                    ← stores + RxDB schemas (colocated per area)
        ├── commands/                ← COPIED. One use-case per file. All writes.
        │   └── *-index.ts           ← command barrels
        ├── pages/                   ← REBUILT. Routed components + use-*-vm.ts
        ├── ui/                      ← REBUILT. Components owned by the area.
        └── index.ts                 ← barrel: only what other areas consume
```

**Store file names are not uniform.** Read off the tree; do not normalise them into a pattern:

| Store                                                 | File                                       | Base                                                |
| ----------------------------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| `DeckStore` `CardStore` `QuestionStore` `FolderStore` | `decks/data/stores.ts`                     | `CollectionStore`                                   |
| `NotificationStore`                                   | `notifications/data/notification-store.ts` | `CollectionStore`                                   |
| `ProfileStore`                                        | `auth/data/stores.ts`                      | `SingletonDocStore`                                 |
| `PreferencesStore`                                    | `settings/data/preferences-store.ts`       | `SingletonDocStore`                                 |
| `ProgressStore`                                       | `progress/data/progress-store.ts`          | `SingletonDocStore`                                 |
| **`SessionStore`**                                    | `auth/data/stores.ts`                      | **none** — `load()`/`set()`/`clear()`, no `start()` |

`auth/data/` additionally holds the **second port**: `auth-gateway.ts` (the `AuthGateway` interface)
with `local-auth-gateway.ts` as its adapter. It binds into `Services` beside the repositories.

**`components.json` aliases** (shadcn writes here; they must match `tsconfig` paths):

```json
{
  "style": "nova",
  "base": "base",
  "rsc": false,
  "tsx": true,
  "tailwind": { "css": "src/styles/index.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/shared/ui",
    "ui": "@/shared/ui",
    "utils": "@/shared/lib/utils",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  }
}
```

**Area contents after P0** (pages/ui land in later phases):

| Area             | model / data / commands (P0)                                     | pages + ui (phase) |
| ---------------- | ---------------------------------------------------------------- | ------------------ |
| `decks/`         | deck, folder, card, question; deck/folder/card/question commands | P1                 |
| `practice/`      | quiz-machine, match-machine                                      | P2                 |
| `study/`         | review commands, session-machine, scope                          | P3                 |
| `auth/`          | SessionStore, ProfileStore, session commands                     | P4                 |
| `progress/`      | ProgressStore (**moved from `study/`**), rewards                 | P5                 |
| `settings/`      | PreferencesStore, set-preferences                                | P6                 |
| `notifications/` | NotificationStore, notification commands                         | P7                 |
| `import/`        | import-content, apply-content, import-draft                      | P8                 |

---

# Part C — Phase map

Each phase ends green: `npm run typecheck && npm run lint && npm run test && npm run build`.

Two standing items are part of **every** P1–P8 phase and are not repeated in the table:

1. **Port the area's RTL tests from `main` first** (rename `.test.tsx` → `.spec.tsx`, rewrite imports,
   swap the DI wrapper to `ServicesProvider` + `createTestServices`). They are the phase's parity bar
   in executable form; `main` has 104 test files and the Angular tree kept 64.
2. **Accessibility:** every page the phase ships gets an axe smoke spec
   (`expectNoA11yViolations`), and the phase closes with a manual WCAG AA pass of its pages
   (ADR-0006's per-page gate, restored).

| #      | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Definition of done                                                                                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | Foundation. Branch, worktrees, delete both old trees, scaffold, shadcn init, observable + `useStore`, copy core, composition root, router shell, one live page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Tests green (incl. all 18 domain specs), app boots, one route renders live RxDB data                                                                                               |
| **P1** | **Decks.** Library, tree, detail, questions, settings, content editor. All three VM hooks. **Builds `OverlayHost` + `openDrawer`/`openDialog` (A.4)** — every later area depends on it. **Includes the never-built deck-tree drag-and-drop — port `use-optimistic-patch` + its test from `main` before building it** (CODE_STYLE §10 names it load-bearing against drop flicker; §10's worked examples `DeckDragPreview`, `siblingDecks()` also live on `main`). Ports `main`'s glass-pill nav + status-bar cap; builds the `Drawer` contract (ADR-0010: `VirtualKeyboardProvider` baked in, `snapPoints` API); retunes shadcn size variants to the 44px floor; 16px inputs; theme provider syncs **both** media-attributed `theme-color` metas per theme; VT route transitions (ADR-0012); `KeyboardInsetProvider` + `AppScreen` scroll capacity (ADR-0010 amendment). Verifies the A.4 deletion candidates on device | Parity vs `main`; dnd works; `openMoveDeckSheet`/`openFolderSheet` keep their promise signatures (renamed `open*Drawer` — glossary); three VMs earned and tested without rendering |
| **P2** | **Practice.** Quiz, match. Machines already ported and tested                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Parity vs `main`                                                                                                                                                                   |
| **P3** | **Study.** Session, 8 card faces, mode sheets, in-study editor. **Never reached Angular.** Binds specs 07-10/13/14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Parity vs `main`; flip lifecycle + card scroll + keyboard rules hold                                                                                                               |
| **P4** | **Auth.** Login, signup, forgot, welcome, threshold. **Pages never reached Angular** (stores/commands did)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Parity vs `main`; route middleware gates correctly; login/signup forms reachable under an open keyboard (top-aligned or safe-centered, `--kb-inset` scrolling verified on device)  |
| **P5** | **Progress.** Profile, streak, badges, achievements. **Never reached Angular**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Parity vs `main`                                                                                                                                                                   |
| **P6** | **Settings.** Hub + profile, password, privacy, help, about, swipe editor, select-toolbar editor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Parity vs `main`                                                                                                                                                                   |
| **P7** | **Notifications.** Center page, grouped panel                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Parity vs `main`                                                                                                                                                                   |
| **P8** | **Import.** Paste notes, Anki file, import review. **Gated off in Angular**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Parity vs `main`                                                                                                                                                                   |
| **P9** | Teardown. Retire both worktrees, write ADRs 0013+ (0010–0012 exist since 2026-07-17), mark 0001–0009 superseded, rewrite CLAUDE.md + CODE_STYLE.md + README.md (still Angular CLI boilerplate) + refresh MOBILE_DESIGN.md paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | All areas at parity; docs describe reality                                                                                                                                         |

**P0 → P1 is the critical path.** If the pattern is wrong, P1 exposes it; everything after is
repetition. **P3 and P5 carry the most estimate risk** — they are net-new builds with no prior port,
and P3 additionally inherits three behavioural specs.

**Dependency order** is `decks → practice → study → progress → auth → settings → notifications →
import`, matching ADR-0006's ordering, which was sound.

### Post-parity backlog (recorded, not scheduled)

Raised in review sessions. None blocks parity; none is licence to widen a phase:

- **Screen Wake Lock during study** — keep the screen awake mid-session (`navigator.wakeLock`),
  gated by a Preference, re-acquired on visibility regain. Study is read-and-think; the screen
  dimming mid-card is a real annoyance native apps solve.
- **Manifest shortcuts** — long-press app icon → "Study due" / "New deck", once those routes are
  stable enough to hardcode.
- **Storage footprint in Settings** — surface `navigator.storage.estimate()` in privacy/help.
- **Local error log** — `RouteErrorBoundary` appends to a small local ring buffer surfaced in Help;
  no telemetry, offline-first.
- **Bundle budget in CI** — fail the build when a route chunk crosses a set threshold.
- **Shared-element polish** — extend ADR-0012's `view-transition-name` coverage beyond deck→detail
  once P1–P3 are stable.

---

# Part D — P0: Foundation

**Prerequisite:** run from a clean `angular-migration` at `408267a`.

### Task 1: Branch, reference worktrees, and clear the tree

**Files:**

- Delete: `legacy-react/` (251 files), `src/app/**` Angular View layer, `angular.json`,
  `ngsw-config.json`, `transloco.config.ts`, `tsconfig.spec.json`, `.angular/`
- Preserve (moved in Tasks 6–8): `src/app/shared/domain/`, `src/app/*/model/`, `src/app/*/commands/`,
  `src/app/shared/data/`, `src/app/shared/config/` (pure TS — `select-toolbar.ts` has a colocated
  spec; the settings editors' tested `normalize*` rules live here), `src/styles/`, `public/`

**Interfaces:**

- Produces: branch `react-return`; worktrees `../mindscape-ref` (main) and `../mindscape-ng` (angular)

- [ ] **Step 1: Cut the branch**

```bash
git checkout -b react-return
```

- [ ] **Step 2: Create both reference worktrees**

```bash
git worktree add ../mindscape-ref main
git worktree add ../mindscape-ng angular-migration
```

- [ ] **Step 3: Verify the behavioural reference actually runs**

```bash
cd ../mindscape-ref && npm i && npm run build
```

Expected: a successful Vite build. This is the parity bar for all ten phases — if it does not run, stop
and resolve that before proceeding.

- [ ] **Step 4: Stash the framework-agnostic core out of the Angular tree**

```bash
cd -
mkdir -p .keep
git mv src/app/shared/domain .keep/domain
git mv src/app/shared/data   .keep/data
git mv src/app/shared/config .keep/config              # pure TS + tested; deleting it would orphan the settings editors' normalize* rules
git mv src/app/app-database.ts .keep/app-database.ts   # the RxDB factory lives at the app root, not in shared/data
for a in decks practice study auth settings notifications import; do
  [ -d "src/app/$a/model" ]    && mkdir -p ".keep/$a" && git mv "src/app/$a/model" ".keep/$a/model"
  [ -d "src/app/$a/commands" ] && mkdir -p ".keep/$a" && git mv "src/app/$a/commands" ".keep/$a/commands"
  [ -d "src/app/$a/data" ]     && mkdir -p ".keep/$a" && git mv "src/app/$a/data" ".keep/$a/data"
done
```

> `app-database.ts` is easy to miss — it sits at `src/app/`, not under `shared/data/`, so the two
> directory moves above skip it and Task 8 would have no `createDatabase` to restore.

- [ ] **Step 5: Delete everything else**

```bash
git rm -r --quiet legacy-react src/app .scratch/angular-migration
git rm --quiet angular.json ngsw-config.json transloco.config.ts tsconfig.spec.json
rm -rf .angular
```

- [ ] **Step 6: Verify the core survived and the rest is gone**

```bash
test -f .keep/domain/srs.spec.ts && echo "core preserved"
test -f .keep/config/select-toolbar.spec.ts && echo "config preserved"
test ! -d legacy-react && echo "legacy-react gone"
find .keep -name '*.ts' | wc -l    # expect ~155
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: clear Angular tree and legacy-react, preserve framework-agnostic core

legacy-react/ is verified byte-identical to main:src/ and main has 0 commits
since the fork at 87e68f4, so this deletes nothing git does not hold.
Parity references live in worktrees on main and angular-migration.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Vite + React + TypeScript toolchain

**Files:**

- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`,
  `tsconfig.node.json`, `index.html`, `.nvmrc`, `src/test-setup.ts`, `src/shared/test/axe.ts`
- Delete: `.postcssrc.json` (Tailwind v4's Vite plugin replaces it), `eslint.config.js` (the Angular
  one — its plugins are gone; the React config lands in Task 13)

**Interfaces:**

- Produces: alias `@/*` → `src/*`; `npm run dev|build|typecheck|lint|test`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "mindscape",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=22.22" },
  "description": "Mindscape — Your Memory Palace. Offline-first PWA (feature areas + Clean Architecture + MVVM).",
  "scripts": {
    "dev": "vite",
    "start": "vite",
    "build": "tsc --noEmit -p tsconfig.app.json && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.app.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "prepare": "husky"
  },
  "dependencies": {
    "@base-ui/react": "^1.6.0",
    "@dnd-kit/core": "^6.3.1",
    "@fontsource/lexend": "^5.2.11",
    "@dnd-kit/modifiers": "^9.0.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "i18next": "^26.3.6",
    "lucide-react": "^1.24.0",
    "motion": "^12.42.2",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-i18next": "^17.0.10",
    "react-router": "^8.2.0",
    "rxdb": "^17.4.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/vite": "^4.3.3",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^26.1.1",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "axe-core": "^4.12.1",
    "eslint": "^10.5.0",
    "eslint-import-resolver-typescript": "^4.4.5",
    "eslint-plugin-boundaries": "^7.0.2",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.3",
    "fake-indexeddb": "^6.2.5",
    "globals": "^17.6.0",
    "husky": "^9.1.7",
    "jsdom": "^29.1.1",
    "lint-staged": "^17.0.8",
    "prettier": "^3.8.4",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.3",
    "typescript-eslint": "^8.64.0",
    "vite": "^8.1.5",
    "vite-plugin-pwa": "^1.3.0",
    "vitest": "^4.1.10"
  }
}
```

> Every version above was verified against the npm registry on 2026-07-17. Noteworthy: `@types/node`
> matches the installed Node 26; `eslint-plugin-boundaries` is v7 (v6 is a major behind); there is no
> `workbox-precaching` — `generateSW` bundles Workbox itself; `axe-core` powers the per-page a11y
> smoke specs; `@fontsource/lexend` self-hosts the app font (offline-first — see A.5). `vitest-axe`
> was considered and rejected: stale at 0.1.0. `husky` + `lint-staged` carry the Prettier-on-commit
> hook over from the Angular tree (`.husky/` and `.lintstagedrc` survive Task 1 untouched) — the
> `prepare` script and both devDeps must stay or the hook dies silently.
>
> `zustand`, `vaul`, `@tanstack/react-router`, and every `@angular/*`, `primeng`, `@primeuix`,
> `@jsverse/transloco` package are deliberately absent.

**Two version pins are deliberate ceilings, not staleness. Do not "upgrade" them:**

- **`typescript: ~6.0.3` — NOT 7.x, though 7.0.2 is `latest`.** `typescript-eslint@8.64.0` declares
  `typescript: ">=4.8.4 <6.1.0"`. TypeScript 7 (the native Go port) would break `npm run lint`
  outright. The tilde is intentional: `^6.0.3` would allow a future 6.1 that also breaches the cap.
  Revisit when typescript-eslint ships TS7 support.
- **`react-router: ^8.2.0`.** v8 landed 2026-06-17; 8.2.0 on 2026-07-08. It keeps data mode,
  `createBrowserRouter`, `lazy`, and `middleware` — `middleware` is now **stable**, no longer behind
  `future.v8_middleware`. Its breaking changes barely touch us: `react-router-dom` is gone (we import
  from `react-router`), `data` → `loaderData` (we use neither), and Node 22.22+ / React 19.2.7+ /
  Vite 7+ are all satisfied. **`RouterProvider` now comes from `react-router/dom`** (verified against
  the shipped package: both entry points export it, but `./dom` is the DOM-wired one).

- [ ] **Step 2: Write `vite.config.ts`**

The PWA block is `main`'s, ported verbatim (`git show main:vite.config.ts` to compare) — `generateSW`
with an inline manifest. The icons it names (`pwa-192x192.png`, `pwa-512x512.png`,
`maskable-512x512.png`, `apple-touch-icon.png`, `favicon.svg`) all already exist in `public/`.

```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mindscape — Your Memory Palace',
        short_name: 'Mindscape',
        description: 'Train your memory with the method of loci. Offline-first.',
        lang: 'en',
        theme_color: '#091A7A',
        background_color: '#ADC8FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

> **The first line is load-bearing.** `defineConfig` from `'vite'` does not know the `test` property;
> without `/// <reference types="vitest/config" />` this file fails typecheck with TS2769 (this is
> `main`'s exact pattern; `import { defineConfig } from 'vitest/config'` is the equivalent
> alternative). The `include` accepts both `.spec` and `.test` so tests ported from `main` run before
> their rename lands. The manifest's two hex values are allowed here — a webmanifest is JSON consumed
> by the browser installer; CSS tokens cannot reach it.

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 4: Write `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vite-plugin-pwa/react"],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

> No `WebWorker` lib and no `src/sw.ts` — `generateSW` writes the service worker at build time
> (see Task 2 Step 2 and A.6). `vite-plugin-pwa/react` in `types` is what makes
> `virtual:pwa-register/react` resolve for the update prompt.

- [ ] **Step 5: Write `tsconfig.node.json`**

`tsconfig.json` references it, so it must exist or `tsc -b` fails. It covers the build-time files that
run in Node, not the browser.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Write `src/test-setup.ts` and the a11y helper**

The `localStorage` shim is copied from `main`'s `src/shared/test/setup.ts` — `LocalAuthGateway`
and the theme persistence read `localStorage`, and the ported tests expect the shim's semantics
in environments where jsdom doesn't provide one.

```ts
// src/shared/test/axe.ts
import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * The per-page a11y smoke gate (Global Constraints). Runs axe-core over a rendered
 * container. color-contrast is disabled because jsdom performs no real layout or
 * paint — contrast is covered by each phase's manual WCAG AA pass in a browser.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(violations).toEqual([])
}
```

```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  const memoryStorage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  } as unknown as Storage

  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true })
  if (typeof window !== 'undefined' && !window.localStorage) {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true })
  }
}
```

- [ ] **Step 7: Write `index.html`**

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
    <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-visual"
    />
    <meta content="#091A7A" media="(prefers-color-scheme: light)" name="theme-color" />
    <meta content="#091A7A" media="(prefers-color-scheme: dark)" name="theme-color" />
    <meta content="yes" name="mobile-web-app-capable" />
    <meta content="yes" name="apple-mobile-web-app-capable" />
    <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />
    <meta content="Mindscape" name="apple-mobile-web-app-title" />
    <meta
      content="Mindscape — Your Memory Palace. Train recall with the method of loci. Offline-first."
      name="description"
    />
    <title>Mindscape — Your Memory Palace</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

> Head content is `main`'s (`git show main:index.html`) with three deliberate deviations. First, no
> manifest `<link>` — vite-plugin-pwa injects it at build time. Second, `main`'s
> `maximum-scale=1.0, user-scalable=no` is **dropped from the markup**: blocking pinch-zoom in the
> browser tab fails WCAG 1.4.4 — the installed app instead locks zoom at boot when
> `(display-mode: standalone)` matches (ADR-0010; snippet in Step 10). Third,
> `apple-mobile-web-app-status-bar-style` is **`black-translucent`** — the app draws edge-to-edge
> under the iOS status bar and the shell paints a contrast-safe cap behind the white status text
> (grill session 2026-07-17; the cap is `main`'s existing safe-area bar, ported in P1 on the
> `--ms-z-nav` scale). `theme-color` ships as **two media-attributed tags** — dark-mode Chromium
> ignores a single un-attributed one — and the P1 theme provider updates **both** on every
> `data-theme` switch, so the app theme wins regardless of the OS scheme. It updates by
> **removing and re-appending fresh meta nodes, not by mutating `content`** — iOS Safari
> (browser mode) often ignores in-place mutations of an existing `theme-color` tag; recreating the
> node is the established workaround, and Chromium accepts either. (iOS standalone ignores
> `theme-color` entirely; there the painted cap under `black-translucent` is the only control —
> which is exactly why the cap exists. Verify on a real device: the iOS simulator misrenders this.)
> `interactive-widget=resizes-visual` is carried over deliberately — spec 07-14's decision, now
> ADR-0010. `data-theme="light"` is the pre-hydration default; the theme provider owns it at runtime.

- [ ] **Step 8: Remove the Angular lint config, PostCSS, and the legacy-peer-deps escape hatch**

```bash
git rm --quiet eslint.config.js .postcssrc.json .npmrc
echo 26 > .nvmrc && git add .nvmrc
```

> `.npmrc` carried `legacy-peer-deps=true` — a PrimeNG-21-on-Angular-22 workaround. The React
> dependency set resolves cleanly, and keeping the flag would silently mask real peer conflicts;
> Step 9's plain `npm install` is the proof it's gone. `.nvmrc` pins the Node major (React Router 8
> needs 22.22+; the machine runs 26) so every environment and CI picks the same runtime.

Tailwind v4's Vite plugin replaces PostCSS. The React ESLint config lands in Task 13; until then
`npm run lint` will fail, which is expected and called out in each task that skips it.

- [ ] **Step 9: Install and verify the toolchain**

```bash
rm -rf node_modules package-lock.json && npm install
npx tsc --noEmit -p tsconfig.app.json
```

Expected: install succeeds; `tsc` reports no files to check (no `src/**/*.ts` yet) or passes cleanly.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "build: scaffold Vite 8 + React 19 + TypeScript toolchain

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Tailwind v4, tokens, and shadcn init

**Files:**

- Verify carried over: `src/styles/tokens.css` (raw `--ms-*` palette + unprefixed semantic layer +
  `--sw-*` swipe accents — see A.5)
- Restore from `main`: `src/styles/theme.css` (the `@theme inline` bridge, base layer, utilities)
- Create: `src/styles/index.css`, `components.json`, `src/shared/lib/utils.ts`

**Interfaces:**

- Produces: `cn()` from `@/shared/lib/utils`; the `@theme` bridge (`bg-background`, `text-foreground`,
  `text-destructive`, `.pt-safe`, `.sw-tint`, …); shadcn CLI able to write to `@/shared/ui`

- [ ] **Step 1: Write `src/shared/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Restore `theme.css` from `main` and rename its raw-palette prefix**

The Angular port dropped this file; it is the entire token→Tailwind/shadcn bridge (A.5). The only
difference between the two trees' token files is the raw-palette prefix (`--p-*` on `main`,
`--ms-*` here) — verified by diff, values identical.

```bash
git show main:src/styles/theme.css | sed 's/--p-/--ms-/g' > src/styles/theme.css
grep -c 'var(--ms-' src/styles/theme.css   # sanity: the bridge references the carried-over raws
grep -n 'var(--p-' src/styles/theme.css && echo "FAIL: unrenamed raw token" || echo "clean"
```

Then append one shadcn-specific line inside its `@theme inline` block (shadcn's components size
their corners from `--radius`; `main` never defined it because `main` had no shadcn):

```css
--radius: var(
  --ms-radius-md
); /* 16px — shadcn's base radius; generous corners are the app's look */
```

> `theme.css` maps `--color-background: var(--surface)` — a **solid**. The gradients (`--bg`,
> `--bg-daylight`) are applied as `background` on `#root` in its base layer and must never enter a
> `@theme` color slot: `bg-background/50` and `color-mix()` break on a gradient.

- [ ] **Step 3: Convert the token scale to rem, re-hue warning, add scrollbar styling (ADR-0011 + grill 2026-07-17)**

Edit the carried-over `src/styles/tokens.css`:

**rem conversion (ADR-0011).** Every `--ms-text-*`, `--ms-space-*`, `--ms-radius-*`, and
`--ms-container-app` value converts px → rem at a 16px base (`14px` → `0.875rem`, `20px` →
`1.25rem`, `430px` → `26.875rem`; the `9999px` pill radius stays as-is). **Do not convert** shadow
offsets, blur radii, or 1px hairlines — the ADR's deliberate px carve-outs.

**Warning re-hue (grill decision).** Move the `--warning*` family from the amber band to the gold
band: keep each value's lightness and chroma, set hue ≈ 84 — light theme `--warning:
oklch(76.9% 0.148 84)`, `--warning-foreground: oklch(55.5% 0.132 84)`; apply the same
keep-L/C-shift-hue rule to the dark block. The `--ms-amber-*` raws stay until P9 confirms nothing
else consumes them. Verify both themes' warning text pairings still hit 4.5:1.

**Desktop scrollbars (grill decision).** Append to the restored `theme.css`, inside `@layer base`:

```css
@media (pointer: fine) {
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
}
```

Verify the conversion left no stray px in the converted groups:

```bash
grep -nE -- '--ms-(text|space|radius|container)[^:]*: *[0-9.]+px' src/styles/tokens.css \
  && echo "FAIL: unconverted px token" || echo "clean"
```

- [ ] **Step 4: Write `src/styles/index.css`**

```css
@import '@fontsource/lexend/300.css';
@import '@fontsource/lexend/400.css';
@import '@fontsource/lexend/500.css';
@import '@fontsource/lexend/600.css';
@import '@fontsource/lexend/700.css';
@import 'tailwindcss';
@import './tokens.css';
@import './theme.css';
```

> `main` loaded these five weights from the Google Fonts CDN — an offline-first violation this plan
> fixes (A.5): self-hosted woff2 lands in the SW precache glob. The family name is unchanged
> (`Lexend`), so `--ms-font-sans` needs no edit.

- [ ] **Step 5: Initialise shadcn**

```bash
npx shadcn@latest init --base base
```

When prompted, accept `base` (not `radix`) and `lucide`. Do **not** pass `--template` — that flag
scaffolds a new project (`init|create` is one merged command); inside the existing repo, init detects
Vite on its own. Flags verified against the shipped CLI: `-b, --base <base>` takes `(base, radix)`.

> **`--base base` is load-bearing and easy to get wrong.** shadcn ships two variants of every
> component and they use _different primitives_. Verified from source:
>
> - `bases/base/ui/drawer.tsx` → `import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"`
> - `bases/radix/ui/drawer.tsx` → `import { Drawer as DrawerPrimitive } from "vaul"`
>
> **radix is the default**, and the shadcn MCP server reports `@shadcn/drawer` as depending on `vaul`
> for exactly that reason. Omitting the flag silently gets you the vaul drawer — the one this plan
> rejected. All 22 components this project uses were confirmed present in the `base` variant.

- [ ] **Step 6: Reconcile shadcn's generated CSS with the token system**

`shadcn init` writes its own default palette into the Tailwind CSS entry file: a `:root { … }` block
of neutral `oklch` literals, a `.dark { … }` block, and its own `@theme inline`. All three conflict
with the token system — ours feeds shadcn's variables from `tokens.css` via `theme.css`, and dark
mode is `[data-theme='dark']`, never a `.dark` class. Open `src/styles/index.css` and:

1. Delete the generated `:root` and `.dark` palette blocks entirely.
2. Delete the generated `@theme inline` block — `theme.css` already provides the mappings. If the
   generated block maps a `--color-*` slot that `theme.css` lacks and a P0 component actually
   consumes (e.g. `--color-card`, `--color-popover` are already covered), add the mapping to
   `theme.css` fed from a semantic token — never paste a raw `oklch()` literal.
3. Keep the four `@import` lines from Step 4 in order (fonts → tailwindcss → tokens → theme).

```bash
grep -n 'oklch(' src/styles/index.css && echo "FAIL: raw palette survived" || echo "clean"
grep -n '\.dark' src/styles/index.css && echo "FAIL: .dark block survived" || echo "clean"
```

- [ ] **Step 7: Correct `components.json` aliases to the feature-area structure**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "nova",
  "base": "base",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/shared/ui",
    "ui": "@/shared/ui",
    "utils": "@/shared/lib/utils",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  }
}
```

- [ ] **Step 8: Add the P0 component set and verify the alias took effect**

```bash
npx shadcn@latest add button card drawer dialog alert-dialog empty skeleton
ls src/shared/ui/
```

Expected: `button.tsx card.tsx drawer.tsx dialog.tsx alert-dialog.tsx empty.tsx skeleton.tsx` in
`src/shared/ui/`, **not** in `src/components/ui/`. If they landed elsewhere, the aliases are wrong —
fix `components.json` and re-add before continuing.

- [ ] **Step 9: Read the generated Drawer and confirm the Base UI import**

```bash
grep -n "@base-ui/react" src/shared/ui/drawer.tsx
```

Expected: an import from `@base-ui/react/drawer`. If it imports `vaul`, the `base` variant did not
apply — stop and re-init.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: Tailwind v4 + semantic tokens + shadcn (base variant) init

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: The observable primitive

Replaces Angular's `signal` — the single Angular dependency in the store base classes.

**Files:**

- Create: `src/shared/data/observable.ts`
- Test: `src/shared/data/observable.spec.ts`

**Interfaces:**

- Produces: `Observable<T>` with `get()`, `set(next)`, `subscribe(listener)`, `asReadonly()`;
  `ReadonlyObservable<T>` with `get()` and `subscribe()`; `Unsubscribe = () => void`

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/data/observable.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { Observable } from './observable'

describe('Observable', () => {
  it('exposes its initial value', () => {
    expect(new Observable(1).get()).toBe(1)
  })

  it('notifies subscribers when the value changes', () => {
    const o = new Observable(1)
    const listener = vi.fn()
    o.subscribe(listener)
    o.set(2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(o.get()).toBe(2)
  })

  it('does not notify when the value is unchanged', () => {
    const o = new Observable(1)
    const listener = vi.fn()
    o.subscribe(listener)
    o.set(1)
    expect(listener).not.toHaveBeenCalled()
  })

  it('stops notifying after unsubscribe', () => {
    const o = new Observable(1)
    const listener = vi.fn()
    const off = o.subscribe(listener)
    off()
    o.set(2)
    expect(listener).not.toHaveBeenCalled()
  })

  it('survives a listener unsubscribing during notification', () => {
    const o = new Observable(1)
    const calls: string[] = []
    const offA = o.subscribe(() => {
      calls.push('a')
      offA()
    })
    o.subscribe(() => calls.push('b'))
    o.set(2)
    expect(calls).toEqual(['a', 'b'])
  })

  it('exposes a readonly view with stable references', () => {
    const o = new Observable(1)
    const ro = o.asReadonly()
    expect(ro.get).toBe(o.asReadonly().get)
    o.set(5)
    expect(ro.get()).toBe(5)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
npx vitest run src/shared/data/observable.spec.ts
```

Expected: FAIL — `Failed to resolve import "./observable"`.

- [ ] **Step 3: Write the implementation**

```ts
// src/shared/data/observable.ts
export type Unsubscribe = () => void

export interface ReadonlyObservable<T> {
  get(): T
  subscribe(listener: () => void): Unsubscribe
}

/**
 * The reactivity primitive the store base classes are built on — the React-side
 * replacement for Angular's `signal`. Framework-agnostic by design: React binds
 * to it through `useStore`, and tests read it with no React in the room.
 */
export class Observable<T> implements ReadonlyObservable<T> {
  private listeners = new Set<() => void>()
  private readonly readonlyView: ReadonlyObservable<T>

  constructor(private value: T) {
    this.readonlyView = { get: this.get, subscribe: this.subscribe }
  }

  /** Arrow property: `useSyncExternalStore` requires a stable reference. */
  readonly get = (): T => this.value

  /** Arrow property: `useSyncExternalStore` requires a stable reference. */
  readonly subscribe = (listener: () => void): Unsubscribe => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  set(next: T): void {
    if (Object.is(next, this.value)) return
    this.value = next
    // Copy first: a listener may unsubscribe itself during notification.
    for (const listener of [...this.listeners]) listener()
  }

  asReadonly(): ReadonlyObservable<T> {
    return this.readonlyView
  }
}
```

> Two non-obvious constraints are load-bearing. `get`/`subscribe` are arrow **properties**, not
> methods, because `useSyncExternalStore` re-subscribes whenever `subscribe`'s identity changes — a
> prototype method destructured off the object would loop. The `Object.is` guard mirrors Angular
> signal's default equality and is what stops `useSyncExternalStore` from re-rendering forever.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run src/shared/data/observable.spec.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/shared/data/observable.ts src/shared/data/observable.spec.ts
git commit -m "feat: framework-agnostic Observable to replace Angular signal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: The `useStore` bridge

**Files:**

- Create: `src/shared/data/use-store.ts`
- Test: `src/shared/data/use-store.spec.tsx`

**Interfaces:**

- Consumes: `ReadonlyObservable<T>` (Task 4)
- Produces: `useStore<T>(observable: ReadonlyObservable<T>): T`

- [ ] **Step 1: Write the failing test**

```tsx
// src/shared/data/use-store.spec.tsx
import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { Observable } from './observable'
import { useStore } from './use-store'

describe('useStore', () => {
  it('returns the current value', () => {
    const o = new Observable(1)
    const { result } = renderHook(() => useStore(o.asReadonly()))
    expect(result.current).toBe(1)
  })

  it('re-renders when the observable changes', () => {
    const o = new Observable(1)
    const { result } = renderHook(() => useStore(o.asReadonly()))
    act(() => o.set(2))
    expect(result.current).toBe(2)
  })

  it('unsubscribes on unmount', () => {
    const o = new Observable(1)
    const { unmount } = renderHook(() => useStore(o.asReadonly()))
    unmount()
    act(() => o.set(2))
    expect(o.get()).toBe(2) // no throw, no leaked listener
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
npx vitest run src/shared/data/use-store.spec.tsx
```

Expected: FAIL — `Failed to resolve import "./use-store"`.

- [ ] **Step 3: Write the implementation**

```ts
// src/shared/data/use-store.ts
import { useSyncExternalStore } from 'react'
import type { ReadonlyObservable } from './observable'

/**
 * Binds a framework-agnostic store observable into React rendering.
 * The store itself knows nothing about React; this is the only seam.
 */
export function useStore<T>(observable: ReadonlyObservable<T>): T {
  return useSyncExternalStore(observable.subscribe, observable.get, observable.get)
}
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run src/shared/data/use-store.spec.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/shared/data/use-store.ts src/shared/data/use-store.spec.tsx
git commit -m "feat: useStore bridge over useSyncExternalStore

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Restore the domain core and `shared/config`

The behavioural anchor. 2,886 lines, 18 spec files, zero `@angular` imports — plus `shared/config/`
(pure TS: `constants`, `routes`, `swipe`, `flashcard-swipe`, and `select-toolbar` with its colocated
spec; the settings editors' tested `normalize*` rules live here).

**Files:**

- Move: `.keep/domain/**` → `src/shared/domain/**`, `.keep/config/**` → `src/shared/config/**`

**Interfaces:**

- Produces: `@/shared/domain` barrel — `srs`, `streak`, `stats`, `recall`, `deckTree`, `order`,
  `achievements`, `badges`, `naming`, `entity`, `shuffle`, `clock`, `gestures`, `haptics`,
  `dropZone`, `avatar`, `contentTransfer`, `studyOverview`, `validation`, `eventBus`, `events`

- [ ] **Step 1: Move it into place**

```bash
mkdir -p src/shared
git mv .keep/domain src/shared/domain
git mv .keep/config src/shared/config
```

- [ ] **Step 2: Rewrite the path alias**

```bash
grep -rl "@app/" src/shared/domain src/shared/config | xargs sed -i '' 's|@app/|@/|g'
```

- [ ] **Step 3: Confirm no Angular import survived**

```bash
grep -rn "@angular" src/shared/domain/ src/shared/config/ && echo "FAIL: Angular import found" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 4: Run the specs — the whole point of this task**

```bash
npx vitest run src/shared/domain src/shared/config
```

Expected: 18 domain spec files plus `select-toolbar.spec.ts`, all passing. **These tests are the
evidence the core survived the framework change intact. If any fails, do not adjust the test — find
out what the move broke.**

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: restore framework-agnostic domain core + shared/config (19 spec files green)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Restore entity models and commands

**Files:**

- Move: `.keep/<area>/model` → `src/<area>/model`, `.keep/<area>/commands` → `src/<area>/commands`
- Modify: 2 **spec** files that import `@angular` (all 100 command implementations are clean)

**Interfaces:**

- Produces: per-area `model/` types and factories; per-area `commands/` use-cases and their barrels

- [ ] **Step 1: Move every area's model and commands**

```bash
for a in decks practice study auth settings notifications import; do
  [ -d ".keep/$a/model" ]    && mkdir -p "src/$a" && git mv ".keep/$a/model" "src/$a/model"
  [ -d ".keep/$a/commands" ] && mkdir -p "src/$a" && git mv ".keep/$a/commands" "src/$a/commands"
done
```

- [ ] **Step 2: Rewrite the path alias**

```bash
grep -rl "@app/" src --include='*.ts' | xargs sed -i '' 's|@app/|@/|g'
```

- [ ] **Step 3: Find the two Angular-importing files**

```bash
grep -rln "@angular" src/*/commands/
```

Expected — exactly these two, **both spec files** (verified against the tree; an earlier draft
wrongly assumed they were command implementations, so note the correction: **all 100 command files
are already framework-agnostic**, better than the spec claimed):

```text
src/auth/commands/session-commands.spec.ts
src/notifications/commands/notification-commands.spec.ts
```

- [ ] **Step 4: De-TestBed the two specs**

Both use the same pattern: `TestBed.configureTestingModule({ providers: [{ provide: X_REPOSITORY,
useValue: new InMemoryRepository<X>() }] })` followed by `TestBed.inject(XStore)`. The command
implementations they exercise are untouched. Rewrite each arrangement to direct construction — the
same shape every sibling command spec already uses:

```ts
// was:
//   TestBed.configureTestingModule({
//     providers: [{ provide: SESSION_REPOSITORY, useValue: new InMemoryRepository<Session>() }],
//   })
//   const sessionStore = TestBed.inject(SessionStore)
// becomes:
const sessionStore = new SessionStore(new InMemoryRepository<Session>())
```

Delete the `@angular/core/testing` import and any injection-token import (the tokens themselves die
in Task 8). Assertions and test bodies do not change. **If either spec turns out to need anything
beyond this, stop and report — that contradicts the measurement above.**

- [ ] **Step 5: Verify no Angular import survives anywhere**

```bash
grep -rn "@angular" src/ && echo "FAIL" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Run the command specs**

```bash
npx vitest run src
```

Expected: domain specs plus the command specs (`folder-commands`, `data-commands`,
`notification-commands`, `preferences-commands`, `profile-commands`, `progress-commands`,
`question-commands`, `review-commands`, `session-commands`, `content`, `rewards`,
`complete-session`, `due-queue-flow`, `scope`, `quiz-machine`, `match-machine`, `session-machine`)
all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: restore entity models and CQRS-lite commands, de-Angular 2 files

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Restore the data layer, re-primitive the store bases, de-Angular the subclasses

**Files:**

- Move: `.keep/data/**` → `src/shared/data/**`; `.keep/<area>/data` → `src/<area>/data`;
  `.keep/app-database.ts` → `src/shared/data/database.ts`
- Modify: `src/shared/data/collection-store.ts`, `src/shared/data/singleton-doc-store.ts`
- Modify (de-Angular): `src/decks/data/stores.ts`, `src/auth/data/stores.ts`,
  `src/notifications/data/notification-store.ts`, `src/settings/data/preferences-store.ts`,
  `src/study/data/progress-store.ts`
- Delete: `src/shared/data/event-bus.token.ts`

**Interfaces:**

- Consumes: `Observable` (Task 4)
- Produces: `Repository<T>`, `Identifiable`, `Unsubscribe`, `RxdbRepository`, `InMemoryRepository`,
  `createDatabase()`, `AuthGateway`, `LocalAuthGateway`, `CollectionStore<T>` (`entities`, `status`,
  `start`, `stop`, `save`, `remove`), `SingletonDocStore<T>`, and the concrete stores:
  - `CollectionStore` subclasses — `DeckStore`, `CardStore`, `QuestionStore`, `FolderStore`
    (`@/decks/data/stores`), `NotificationStore` (`@/notifications/data/notification-store`)
  - `SingletonDocStore` subclasses — `ProfileStore` (`@/auth/data/stores`), `PreferencesStore`
    (`@/settings/data/preferences-store`), `ProgressStore` (`@/study/data/progress-store`, moved to
    `@/progress/` in Task 9)
  - **`SessionStore`** (`@/auth/data/stores`) — extends nothing; exposes `session`, `status`,
    `load()`, `set()`, `clear()`

**Facts this task depends on (verified against the tree, do not re-derive):**

- `createDatabase` lives in `src/app/app-database.ts`, **not** `shared/data/database.ts`.
- RxDB schemas are **colocated per area** (`decks/data/schemas.ts`), not in `shared/`.
- The `data/` layer declares **11 `InjectionToken`s** and **18 Angular decorators**. All are deleted.
- Every store already takes its repository as a constructor parameter, precisely so unit tests could do
  `new DeckStore(repo)` without DI. That is what makes the de-Angular pass mechanical.

- [ ] **Step 1: Move the data layer**

```bash
# src/shared/data already exists (observable.ts + use-store.ts from Tasks 4-5), so merge into it.
for f in .keep/data/*; do git mv "$f" src/shared/data/; done
rmdir .keep/data
git mv .keep/app-database.ts src/shared/data/database.ts
for a in decks practice study auth settings notifications import; do
  [ -d ".keep/$a/data" ] && git mv ".keep/$a/data" "src/$a/data"
done
grep -rl "@app/" src --include='*.ts' | xargs sed -i '' 's|@app/|@/|g'
```

- [ ] **Step 2: Delete the event-bus injection token**

```bash
git rm src/shared/data/event-bus.token.ts
grep -rln "event-bus.token" src/ | xargs sed -i '' '/event-bus.token/d'
```

The token is Angular DI. The `EventBus` itself is pure TS in `shared/domain/event-bus.ts` and survives;
it binds into `Services` in Task 10 like any other dependency.

- [ ] **Step 3: Re-primitive `CollectionStore`**

The only change is `signal` → `Observable`. Everything else — the repository port, the `observe`
subscription, the sort, `save`/`remove`, the `start`/`stop` lifecycle — is already framework-agnostic.

```ts
// src/shared/data/collection-store.ts
import { Observable } from './observable'
import type { Identifiable, Repository, Unsubscribe } from './base-repository'

export type StoreStatus = 'idle' | 'loading' | 'ready'

/**
 * Reactive collection store over a Repository<T>: `start()` subscribes to the
 * repository's live query and mirrors it into observables; writes delegate to the
 * repository and flow back through the subscription.
 */
export abstract class CollectionStore<T extends Identifiable> {
  /** Sort applied to every emission; source order when null. */
  protected readonly compare: ((a: T, b: T) => number) | null = null

  constructor(protected readonly repo: Repository<T>) {}

  private readonly _entities = new Observable<T[]>([])
  private readonly _status = new Observable<StoreStatus>('idle')
  readonly entities = this._entities.asReadonly()
  readonly status = this._status.asReadonly()

  private unsubscribe: Unsubscribe | null = null

  start(): void {
    if (this.unsubscribe) return
    this._status.set('loading')
    this.unsubscribe = this.repo.observe((entities) => {
      this._entities.set(this.compare ? [...entities].sort(this.compare) : entities)
      this._status.set('ready')
    })
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity)
  }

  remove(id: string): Promise<void> {
    return this.repo.remove(id)
  }
}
```

- [ ] **Step 4: Re-primitive `SingletonDocStore` the same way**

Read `src/shared/data/singleton-doc-store.ts`. Replace each `signal(x)` with `new Observable(x)`;
`.asReadonly()` call sites are unchanged because `Observable` implements it. Import `Observable` from
`./observable`; delete the `@angular/core` import.

- [ ] **Step 5: De-Angular every store subclass**

This is the step an earlier draft wrongly called unnecessary. Apply to `src/decks/data/stores.ts`,
`src/auth/data/stores.ts`, `src/notifications/data/notification-store.ts`,
`src/settings/data/preferences-store.ts`, and `src/study/data/progress-store.ts`.

For each file: delete the `@angular/core` import, delete every `InjectionToken` declaration, delete
every `@Injectable(...)` decorator, unwrap `@Inject(TOKEN) repo` to plain `repo`, and delete the now
-pointless `eslint-disable @angular-eslint/prefer-inject` comments. **Class bodies do not change.**

`decks/data/stores.ts` goes from this:

```ts
import { Inject, Injectable, InjectionToken } from '@angular/core'
import { CollectionStore } from '@app/shared/data/collection-store'
import type { Repository } from '@app/shared/data'
import type { Deck } from '../model/deck'

export const DECK_REPOSITORY = new InjectionToken<Repository<Deck>>('DECK_REPOSITORY')

@Injectable({ providedIn: 'root' })
export class DeckStore extends CollectionStore<Deck> {
  protected override readonly compare = (a: Deck, b: Deck): number =>
    b.createdAt.localeCompare(a.createdAt)
  readonly decks = this.entities

  // eslint-disable-next-line @angular-eslint/prefer-inject -- constructor param keeps the store directly constructible in unit tests (new XStore(repo))
  constructor(@Inject(DECK_REPOSITORY) repo: Repository<Deck>) {
    super(repo)
  }
}
```

to this:

```ts
import { CollectionStore } from '@/shared/data/collection-store'
import type { Repository } from '@/shared/data'
import type { Deck } from '../model/deck'

export class DeckStore extends CollectionStore<Deck> {
  protected override readonly compare = (a: Deck, b: Deck): number =>
    b.createdAt.localeCompare(a.createdAt)
  readonly decks = this.entities

  constructor(repo: Repository<Deck>) {
    super(repo)
  }
}
```

- [ ] **Step 6: Re-primitive `SessionStore` by hand**

`SessionStore` extends no base class — it uses `signal` directly and exposes `load()`/`set()`/`clear()`
rather than `start()`. Replace its two `signal(...)` calls with `new Observable(...)`, drop the
`@Injectable`/`@Inject`, and delete the `SESSION_REPOSITORY`, `PROFILE_REPOSITORY`, and `AUTH_GATEWAY`
tokens. Its `load()`/`set()`/`clear()` API is unchanged.

Do **not** give it a `start()`. ADR-0008 excludes it from composition-root bootstrap by design: auth
state is loaded once by `restoreSession`, not mirrored from a live query.

- [ ] **Step 7: Confirm the data layer is Angular-free**

```bash
grep -rn "@angular\|InjectionToken\|@Injectable" src/shared/data/ src/*/data/ && echo "FAIL" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 8: Run the repository and store specs**

```bash
npx vitest run src/shared/data src/decks/data src/auth/data src/notifications/data
```

Expected: `in-memory-repository`, `rxdb-repository`, `rxdb-persistence`, `repository-contract`, plus
`folder-store`, `question-store`, `profile-store`, `session-store`, `notification-store` all green.
These prove the port/adapter seam survived the framework change. **They construct stores with
`new XStore(repo)` — which is exactly why the DI removal is safe.**

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: restore data layer; Observable replaces signal; strip Angular DI from stores

Removes 11 InjectionTokens and 18 decorators. Class bodies unchanged — the stores
were always directly constructible, which is what made this mechanical.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Create the `progress/` area

Applies A.3's correction: ADR-0004 specified a `progress/` area that was never built.

**Files:**

- Create: `src/progress/{model,data,commands}/`, `src/progress/index.ts`
- Modify: `src/study/index.ts` (drop `ProgressStore`), every importer of `@/study`'s progress exports

**Interfaces:**

- Produces: `@/progress` barrel exporting `ProgressStore` and the progress commands

The split is exact, because `study/` already separates `progress-index.ts` from `review-index.ts`.
The file list below was read off the tree — move precisely these.

- [ ] **Step 1: Move the progress files**

```bash
mkdir -p src/progress/{model,data,commands,ui}

# model
git mv src/study/model/progress.ts       src/progress/model/
git mv src/study/model/progress.spec.ts  src/progress/model/

# data
git mv src/study/data/progress-store.ts  src/progress/data/

# commands (+ their specs)
for f in award-xp complete-session current-progress record-quiz-result record-training-day rewards progress-index; do
  git mv "src/study/commands/$f.ts" src/progress/commands/
done
for f in complete-session.spec progress-commands.spec rewards.spec; do
  git mv "src/study/commands/$f.ts" src/progress/commands/
done

# ui
git mv src/study/ui/session-reward.ts src/progress/ui/
```

- [ ] **Step 2: Confirm `study/` kept only the SRS engine**

```bash
find src/study -type f -name '*.ts' | sort
```

Expected exactly: `commands/grade-card.ts`, `commands/restore-schedule.ts`, `commands/scope.ts`,
`commands/scope.spec.ts`, `commands/session-machine.ts`, `commands/session-machine.spec.ts`,
`commands/review-index.ts`, `commands/review-commands.spec.ts`, `commands/due-queue-flow.spec.ts`,
`index.ts`. Nothing else. This matches ADR-0007's description: _"`study/` has no pages at all (it is
the SRS engine)."_

- [ ] **Step 3: Split the barrels**

`src/study/index.ts` currently re-exports four things. Two of them move:

```ts
// src/progress/index.ts — NEW
export * from './model/progress'
export * from './data/progress-store'
export * from './commands/progress-index'
```

```ts
// src/study/index.ts — reduced to the SRS engine
/**
 * The study area's public API — the SRS engine: session machine, grading, scheduling.
 * This area has no pages. Progress (XP, streak, rewards) lives in `@/progress`.
 */
export * from './commands/review-index'
```

- [ ] **Step 4: Fix every importer**

```bash
grep -rln "@/study" src/
```

Any file importing a progress symbol (`ProgressStore`, `Progress`, `awardXp`, `completeSession`,
`currentProgress`, `recordQuizResult`, `recordTrainingDay`, or a reward symbol) must import from
`@/progress` instead. Files importing only `gradeCard`/`restoreSchedule`/`scope`/`sessionMachine` keep
`@/study`. Fix the relative imports inside the moved files too — `../model/progress` still resolves,
but `../../shared/...` depths are unchanged since the nesting depth is identical.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit -p tsconfig.app.json && npx vitest run src
```

Expected: both clean. This is a pure move — no behaviour changes, so every spec stays green.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: extract progress/ area per ADR-0004 (never built during the Angular port)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Composition root and `ServicesProvider`

The DI seam. Replaces Angular's injector and `data.providers.ts`.

**Files:**

- Create: `src/composition-root.ts`, `src/shell/services-provider.tsx`
- Test: `src/shell/services-provider.spec.tsx`

**Interfaces:**

- Consumes: every area's stores (Task 8), `createDatabase()` (Task 8)
- Produces: `Services` interface; `createServices(): Promise<Services>`;
  `createTestServices(): Services`; `<ServicesProvider services={…}>`; `useServices(): Services`

- [ ] **Step 1: Write the failing test**

```tsx
// src/shell/services-provider.spec.tsx
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createTestServices } from '@/composition-root'
import { ServicesProvider, useServices } from './services-provider'

describe('ServicesProvider', () => {
  it('provides the services to consumers', () => {
    const services = createTestServices()
    const { result } = renderHook(() => useServices(), {
      wrapper: ({ children }) => (
        <ServicesProvider services={services}>{children}</ServicesProvider>
      ),
    })
    expect(result.current.deckStore).toBe(services.deckStore)
  })

  it('throws a useful error outside a provider', () => {
    expect(() => renderHook(() => useServices())).toThrow(/must be used within a ServicesProvider/)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
npx vitest run src/shell/services-provider.spec.tsx
```

Expected: FAIL — cannot resolve `@/composition-root`.

- [ ] **Step 3: Write `src/composition-root.ts`**

Import paths below were read off the tree. Note that they are **not** uniform — `decks` and `auth`
use `stores.ts`, the other three use a per-store file. Do not "tidy" them into a pattern.

```ts
import { createDatabase } from '@/shared/data/database'
import { InMemoryRepository } from '@/shared/data/in-memory-repository'
import { RxdbRepository } from '@/shared/data/rxdb-repository'
import { EventBus } from '@/shared/domain/event-bus'
import { CardStore, DeckStore, FolderStore, QuestionStore } from '@/decks/data/stores'
import { ProfileStore, SessionStore } from '@/auth/data/stores'
import { LocalAuthGateway } from '@/auth/data/local-auth-gateway'
import type { AuthGateway } from '@/auth/data/auth-gateway'
import { ProgressStore } from '@/progress/data/progress-store'
import { PreferencesStore } from '@/settings/data/preferences-store'
import { NotificationStore } from '@/notifications/data/notification-store'

export interface Services {
  deckStore: DeckStore
  folderStore: FolderStore
  cardStore: CardStore
  questionStore: QuestionStore
  profileStore: ProfileStore
  sessionStore: SessionStore
  progressStore: ProgressStore
  preferencesStore: PreferencesStore
  notificationStore: NotificationStore
  /** The second port beside Repository<T>. LocalAuthGateway is its adapter. */
  authGateway: AuthGateway
  eventBus: EventBus
}

/**
 * Every reactive store is started here, once — never from a component (ADR-0008).
 * `start()` is idempotent, so this is safe to call more than once.
 */
function startAll(services: Services): void {
  services.deckStore.start()
  services.folderStore.start()
  services.cardStore.start()
  services.questionStore.start()
  services.profileStore.start()
  services.progressStore.start()
  services.preferencesStore.start()
  services.notificationStore.start()
  // SessionStore has no start() and is excluded by design: auth state is loaded once
  // by restoreSession (via its load()), not mirrored from a live query.
}

/** Production composition root: RxDB adapters behind every port. */
export async function createServices(): Promise<Services> {
  const db = await createDatabase()
  const services: Services = {
    deckStore: new DeckStore(new RxdbRepository(db.decks)),
    folderStore: new FolderStore(new RxdbRepository(db.folders)),
    cardStore: new CardStore(new RxdbRepository(db.cards)),
    questionStore: new QuestionStore(new RxdbRepository(db.questions)),
    profileStore: new ProfileStore(new RxdbRepository(db.profile)),
    sessionStore: new SessionStore(new RxdbRepository(db.session)),
    progressStore: new ProgressStore(new RxdbRepository(db.progress)),
    preferencesStore: new PreferencesStore(new RxdbRepository(db.preferences)),
    notificationStore: new NotificationStore(new RxdbRepository(db.notifications)),
    authGateway: new LocalAuthGateway(),
    eventBus: new EventBus(),
  }
  startAll(services)
  return services
}

/**
 * Test composition root: the same seam, in-memory adapters. Stores are NOT started —
 * unit tests arrange that precondition themselves (ADR-0008).
 */
export function createTestServices(): Services {
  return {
    deckStore: new DeckStore(new InMemoryRepository()),
    folderStore: new FolderStore(new InMemoryRepository()),
    cardStore: new CardStore(new InMemoryRepository()),
    questionStore: new QuestionStore(new InMemoryRepository()),
    profileStore: new ProfileStore(new InMemoryRepository()),
    sessionStore: new SessionStore(new InMemoryRepository()),
    progressStore: new ProgressStore(new InMemoryRepository()),
    preferencesStore: new PreferencesStore(new InMemoryRepository()),
    notificationStore: new NotificationStore(new InMemoryRepository()),
    authGateway: new LocalAuthGateway(),
    eventBus: new EventBus(),
  }
}
```

> **Read `src/shared/data/database.ts` before writing this** and match every collection name (`db.decks`,
> `db.profile`, …) exactly. It was `app-database.ts` in the Angular tree and its collection names are
> authoritative — do not invent one. Likewise check `LocalAuthGateway`'s constructor: if it takes a
> repository or storage handle, thread it through here.

- [ ] **Step 4: Write `src/shell/services-provider.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react'
import type { Services } from '@/composition-root'

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({
  services,
  children,
}: {
  services: Services
  children: ReactNode
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

/** The DI seam. Components and VM hooks reach the model layer only through this. */
export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices must be used within a ServicesProvider')
  return services
}
```

- [ ] **Step 5: Run the tests**

```bash
npx vitest run src/shell/services-provider.spec.tsx
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: composition root + ServicesProvider (the DI seam)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: i18n — port `main`'s typed catalogue

`main` shipped a **typed** catalogue: `locales/en.ts` ends in `as const` and exports
`AppResources = typeof en`, and `i18next.d.ts` feeds that into i18next's `CustomTypeOptions` — so
every `t('common.cancel')` is compile-checked. The Angular port flattened it into
`public/i18n/en.json` for Transloco, losing key safety. This task restores the typed original and
retires the JSON. (An earlier draft imported the JSON directly — rejected: it forfeits typed keys in
a repo that runs `noUncheckedIndexedAccess`, and importing from `public/` also double-ships the file.)

**Files:**

- Copy from `main`: `src/shared/i18n/index.ts`, `src/shared/i18n/locales/en.ts`,
  `src/shared/i18n/i18next.d.ts`
- Delete (after the key diff): `public/i18n/`

**Interfaces:**

- Produces: initialised `i18next` with **runtime language switching** (a hard requirement — ADR-0005
  revised `@angular/localize` away for exactly this) and typed `t()` keys app-wide

- [ ] **Step 1: Copy the three files from `main`**

```bash
mkdir -p src/shared/i18n/locales
git show main:src/shared/i18n/index.ts        > src/shared/i18n/index.ts
git show main:src/shared/i18n/locales/en.ts   > src/shared/i18n/locales/en.ts
git show main:src/shared/i18n/i18next.d.ts    > src/shared/i18n/i18next.d.ts
```

- [ ] **Step 2: Diff the key sets — the Angular era may have added keys**

`en.json` was derived from `en.ts`, but the Angular port added features' copy directly to the JSON.
Node 26 imports TS and JSON natively, so the diff is one command:

```bash
node --input-type=module -e "
const { en } = await import('./src/shared/i18n/locales/en.ts')
const json = (await import('./public/i18n/en.json', { with: { type: 'json' } })).default
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? flat(v, p + k + '.') : [p + k])
const ts = new Set(flat(en)), js = new Set(flat(json))
console.log('in en.json only (merge into en.ts):', [...js].filter((k) => !ts.has(k)))
console.log('in en.ts only (fine — Angular never ported these):', [...ts].filter((k) => !js.has(k)))
"
```

Merge every `in en.json only` key into `en.ts` at its structural position, with the JSON's value.
Keys only in `en.ts` need nothing — they belong to pages Angular never ported and P1–P8 will use them.

- [ ] **Step 3: Retire the flattened JSON**

```bash
git rm -r public/i18n
```

- [ ] **Step 4: Typecheck — this is what proves the keys are typed**

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Expected: clean. From here on, a typo'd `t('comon.cancel')` anywhere in the app is a compile error.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: react-i18next with typed keys and runtime language switching

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Router shell, PWA, and one live page

The proof: a route rendering live RxDB data through the whole stack.

**Files:**

- Create: `src/main.tsx`, `src/app.tsx`, `src/routes.tsx`, `src/shell/root-layout.tsx`,
  `src/shell/route-error-boundary.tsx`, `src/decks/pages/deck-library-page.tsx`
- Copy from `main` (byte-identical — every import it uses exists in this stack):
  `src/shell/update-prompt.tsx`
- Delete: `public/icons/`, `public/manifest.webmanifest` (Angular-era; vite-plugin-pwa generates the
  manifest and `main`'s `pwa-*.png` / `maskable-512x512.png` icons are already in `public/`)
- Test: `src/decks/pages/deck-library-page.spec.tsx`

**Interfaces:**

- Consumes: `createServices` (Task 10), `useStore` (Task 5), `useServices` (Task 10)
- Produces: a booting app; `router` from `@/routes`

- [ ] **Step 1: Write the failing test**

```tsx
// src/decks/pages/deck-library-page.spec.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestServices } from '@/composition-root'
import { ServicesProvider } from '@/shell/services-provider'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeck } from '@/decks/model/deck'
import { DeckLibraryPage } from './deck-library-page'

describe('DeckLibraryPage', () => {
  it('renders decks from the store', async () => {
    const services = createTestServices()
    services.deckStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    render(
      <ServicesProvider services={services}>
        <DeckLibraryPage />
      </ServicesProvider>,
    )

    expect(await screen.findByText('Capitals')).toBeInTheDocument()
  })

  it('shows the empty state when there are no decks', async () => {
    const services = createTestServices()
    services.deckStore.start()

    render(
      <ServicesProvider services={services}>
        <DeckLibraryPage />
      </ServicesProvider>,
    )

    expect(await screen.findByText(/no decks/i)).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const services = createTestServices()
    services.deckStore.start()
    await services.deckStore.save(
      makeDeck({ id: 'd1', createdAt: '2026-07-16T00:00:00.000Z', name: 'Capitals' }),
    )

    const { container } = render(
      <ServicesProvider services={services}>
        <DeckLibraryPage />
      </ServicesProvider>,
    )
    await screen.findByText('Capitals')

    await expectNoA11yViolations(container)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
npx vitest run src/decks/pages/deck-library-page.spec.tsx
```

Expected: FAIL — cannot resolve `./deck-library-page`.

- [ ] **Step 3: Write the page**

This is a **P0 placeholder proving the stack**, not P1's real library. It has no VM — per the
no-middle-man rule, it reads the store directly, because it owns no derived state or orchestration yet.

```tsx
// src/decks/pages/deck-library-page.tsx
import { useServices } from '@/shell/services-provider'
import { useStore } from '@/shared/data/use-store'
import { Empty } from '@/shared/ui/empty'

export function DeckLibraryPage() {
  const { deckStore } = useServices()
  const decks = useStore(deckStore.entities)

  if (decks.length === 0) return <Empty>No decks yet</Empty>

  return (
    <ul className="flex flex-col gap-2 p-4">
      {decks.map((deck) => (
        <li key={deck.id}>{deck.name}</li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run src/decks/pages/deck-library-page.spec.tsx
```

Expected: 3 passed. **This is the load-bearing moment of P0** — it proves RxDB → repository →
store → `Observable` → `useSyncExternalStore` → React works end to end, with the in-memory adapter
swapped in at the composition root exactly as the Angular tests did — and it seeds the per-page axe
smoke pattern every later page copies.

- [ ] **Step 5: Write `src/shell/route-error-boundary.tsx`**

The Global Constraints require every routed area to sit under a route `ErrorBoundary` — a thrown
render/loader is a recoverable in-app state, never a white screen. `main` had none (verified — this
is a new rigor gain, not a port). Copy stays inline here because the i18n `update.*`-style keys for
errors don't exist yet; P1 moves the strings into `en.ts` when the area boundaries land.

```tsx
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/shared/ui/button'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null

  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1>Something went wrong</h1>
      {detail ? <p className="text-center">{detail}</p> : null}
      <Button onClick={() => window.location.assign('/')}>Back to home</Button>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/routes.tsx`**

```tsx
import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/shell/root-layout'
import { RouteErrorBoundary } from '@/shell/route-error-boundary'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        lazy: async () => {
          const { DeckLibraryPage } = await import('@/decks/pages/deck-library-page')
          return { Component: DeckLibraryPage }
        },
      },
    ],
  },
])
```

> The auth `middleware` gate lands in P4, when the auth pages exist to redirect to. Adding it now would
> gate a route with nowhere to send anyone. In RR8 `middleware` is **stable** — no `future` flag
> needed, unlike v7 where it sat behind `future.v8_middleware`. The root `ErrorBoundary` catches
> errors from every child route until areas grow their own.

- [ ] **Step 7: Write `src/shell/root-layout.tsx`**

```tsx
import { Outlet } from 'react-router'
import { UpdatePrompt } from './update-prompt'

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <UpdatePrompt />
    </div>
  )
}
```

> The 430px column is `docs/MOBILE_DESIGN.md`'s rule. **No `bg-*` on the column** — the app
> background is the `--bg-daylight` gradient painted on `#root` by `theme.css`; a `bg-background`
> here would paint solid `--surface` over it. Text color comes from `theme.css`'s base layer. This is
> a P0 placeholder: P1 replaces it with a port of `main`'s real `RootLayout` — the status-bar cap
> (contrast-safe per theme, on the `--ms-z-nav` scale, not `main`'s `z-1000000000` wart), the
> `AppNav` glass pill, and the splash overlay; `useKeyboardPin` is reviewed under ADR-0010 before
> any port.

- [ ] **Step 8: Copy `src/shell/update-prompt.tsx` from `main`**

`main`'s `UpdatePrompt` is strictly better than a rewrite: sonner toast with an action button,
hourly + visibility-change update checks, i18n'd copy (`update.*` keys arrive with the Task 11
catalogue). Every import it uses (`react`, `react-i18next`, `sonner`, `virtual:pwa-register/react`)
exists in this stack, so it ports without edits:

```bash
git show main:src/app/providers/UpdatePrompt.tsx > src/shell/update-prompt.tsx
grep -n "from '@/" src/shell/update-prompt.tsx && echo "check aliased imports resolve" || echo "no path fixes needed"
```

- [ ] **Step 9: Delete the Angular-era PWA assets**

```bash
git rm -r public/icons
git rm public/manifest.webmanifest public/favicon.ico
```

vite-plugin-pwa generates the manifest from the config in Task 2; `main`'s icon set
(`pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`, `apple-touch-icon.png`,
`favicon.svg`) is already in `public/` and is what the manifest references. `favicon.ico` is an
Angular-era addition — `index.html` links `favicon.svg`, as `main` did.

- [ ] **Step 10: Write `src/app.tsx` and `src/main.tsx`**

```tsx
// src/app.tsx
import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'
import { ServicesProvider } from '@/shell/services-provider'
import type { Services } from '@/composition-root'
import { router } from '@/routes'

export function App({ services }: { services: Services }) {
  return (
    <ServicesProvider services={services}>
      <RouterProvider router={router} />
      <Toaster />
    </ServicesProvider>
  )
}
```

> **`RouterProvider` comes from `react-router/dom`, not `react-router`.** Verified against the shipped
> package: RR8 exports it from both, but `./dom` is the DOM-wired variant (the bare export is the
> framework-agnostic one). This is the v8 shape — `react-router-dom` no longer exists as a package.

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createServices } from '@/composition-root'
import { App } from '@/app'
import '@/shared/i18n'
import '@/styles/index.css'

// Offline-first: the on-device RxDB is the ONLY copy of the learner's data. Ask the browser
// to exempt it from storage-pressure eviction (auto-granted for installed PWAs on Chromium;
// Safari grants for home-screen apps). Fire-and-forget — denial just means default eviction rules.
void navigator.storage?.persist?.()

// Installed app only: lock pinch-zoom (ADR-0010). The browser tab stays zoomable (WCAG 1.4.4);
// the standalone app is gesture-heavy and an accidental pinch mid-swipe reads as breakage.
if (matchMedia('(display-mode: standalone)').matches) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=resizes-visual',
    )
}

const services = await createServices()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
)
```

> Top-level `await` before render is deliberate: the composition root must build RxDB and `start()`
> every store before the first paint, so no component ever sees an unstarted store. The splash overlay
> (P1) covers this window.

- [ ] **Step 11: Run the whole suite, typecheck, and build**

```bash
npm run typecheck && npm run test && npm run build
```

Expected: all green. The build is the real check that styles and assets resolve.

> `npm run lint` is deliberately **not** run here — `eslint.config.js` is written in Task 13. Task 2
> deleted the Angular one, whose plugins are no longer installed.

- [ ] **Step 12: Boot it and confirm a live route**

```bash
npm run dev
```

Open the app. Expected: the empty state renders (no decks in a fresh IndexedDB). This is P0's
definition of done.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: router shell, PWA update prompt, and first live route

Boots end to end: RxDB -> repository -> store -> Observable -> useSyncExternalStore -> React.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: Lint boundaries and close out P0

**Files:**

- Create: `eslint.config.js`
- Delete: `.keep/` (must be empty)

**Interfaces:**

- Produces: the enforced boundary rule — `shared/` imports nothing from a feature area

- [ ] **Step 1: Confirm nothing was left behind**

```bash
find .keep -type f | wc -l
```

Expected: `0`. If not, the remaining files were missed by Tasks 6–9 — move them before continuing.

```bash
rmdir .keep
```

- [ ] **Step 2: Write `eslint.config.js`**

```js
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'dev-dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      // Without this resolver, eslint-plugin-boundaries cannot resolve `@/…` imports,
      // no file gets categorised, and the boundary rule silently never fires. This is
      // exactly what Step 3 exists to catch — but configure it correctly up front.
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' },
      },
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/shared/*' },
        { type: 'shell', pattern: 'src/shell/*' },
        {
          type: 'area',
          pattern: 'src/(decks|practice|study|progress|auth|settings|notifications|import)/*',
          capture: ['area'],
        },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // The one boundary rule: shared/ must never import from a feature area.
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['shared'],
              disallow: ['area'],
              message: 'shared/ must not import from a feature area',
            },
          ],
        },
      ],
    },
  },
)
```

- [ ] **Step 3: Prove the boundary rule actually fires**

Temporarily add `import { DeckStore } from '@/decks/data/stores'` to
`src/shared/data/collection-store.ts`, then:

```bash
npx eslint src/shared/data/collection-store.ts
```

Expected: `error  shared/ must not import from a feature area`. **Remove the import.** A boundary rule
that has never been seen to fail is not a rule. The `@/` alias in the probe import is deliberate —
it exercises the `import/resolver` setting; if the rule fails to fire, suspect the resolver before
the rule.

- [ ] **Step 4: Full verification**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: all green, including the 18 domain specs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: enforce the shared/ boundary rule; close out P0 foundation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## P0 definition of done

- [ ] `legacy-react/` and the Angular tree are gone; both parity worktrees exist and `main`'s runs
- [ ] All 18 domain spec files pass, unmodified
- [ ] `shared/config/` restored; `select-toolbar.spec.ts` green
- [ ] Every command and store spec passes (the two de-TestBed'd specs included)
- [ ] `grep -rn "@angular" src/` returns nothing
- [ ] `progress/` exists per ADR-0004
- [ ] The boundary rule has been observed to fail and then pass
- [ ] Typed i18n in place: `en.ts` + `i18next.d.ts` restored, key diff merged, `public/i18n/` gone
- [ ] Root route mounts `RouteErrorBoundary`; `expectNoA11yViolations` exists and the P0 page spec
      exercises it
- [ ] `theme.css` restored from `main` (`--p-*` → `--ms-*`), shadcn's generated palette deleted
- [ ] Token scale converted to rem (ADR-0011); warning re-hued to gold; thin desktop scrollbars in
      `theme.css`
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` green
- [ ] `npm run dev` boots and one route renders live RxDB data

**Then:** write the P1 plan. Its first jobs, in order: **port `main`'s decks-area RTL tests** (the
parity bar, executable); port `use-optimistic-patch` + its test; verify the A.4 deletion candidates
(`use-drag-to-dismiss`, `useKeyboardInset`/`--kb`) against Base UI's real `Drawer` behaviour, because
that answer shapes every sheet in the app.
