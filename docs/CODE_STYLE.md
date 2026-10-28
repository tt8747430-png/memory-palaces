# Code Style

How code is written here. [CLAUDE.md](../CLAUDE.md) has the layers and change rules,
[UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md) the names, the ADRs (`docs/adr/`) the reasons. Each rule points at
code that already follows it: match that shape.

[§1 Components](#s1) · [§2 Hooks](#s2) · [§3 State](#s3) · [§4 Composition](#s4) · [§5 Kit, tokens, controls](#s5) ·
[§6 TypeScript](#s6) · [§7 Performance](#s7) · [§8 Build and PWA](#s8) · [§9 Motion](#s9) · [§10 Drag and drop](#s10) ·
[§11 Layout, keyboard, safe areas](#s11) · [§12 Gestures](#s12) · [§13 States and offline](#s13) ·
[§14 Copy and i18n](#s14) · [§15 Tests](#s15)

<a id="s1"></a>

## 1. Components

App-wide and purely presentational → `shared/ui/` (the kit). Composite, tied to screens → `widgets/<x>/ui/`. Screen
root → `pages/<x>/ui/`. Part of one parent → beside it.

- About 200 lines a file. Past that, extract children or move state into `model/` (§3).
- **One exported component per file, named for the file.** Private helpers may stay.
- A page composes widgets and the kit, with little markup of its own.
- **One implementation of a thing.** Every list of decks reads its order, filter and shelf headings from
  `useLibraryArrangement`; nothing sorts decks on its own.
- **Offer only what applies.** Omit an option that cannot change what the learner sees here; keep the one currently
  applied; disable (never hide) one that a single tap would make apply (`use-arrange-options.ts`,
  `use-row-availability.ts`). A control that is greyed says why.

<a id="s2"></a>

## 2. Hooks and effects

- Stateful or effectful logic (subscriptions, gestures, timers, measuring) is a hook: shared ones in `shared/lib`
  (`use-long-press`, `use-sticky-header`, `gestures`, `haptics`), one-offs beside their component.
- **Pure domain logic never lives in a component or a hook.** It goes in `shared/lib` or `entities/*/model`, tested
  without React.
- **Derive during render.** `useEffect` only syncs with the outside world; interaction logic goes in handlers. A child
  never reports a derived value up through an effect: pass the derivation down (`useCardList` →
  `useMultiSelect({ visibleIds })`).
- Server reads live behind ports in feature commands or providers, never in a component's `useEffect`.

<a id="s3"></a>

## 3. State

- Values that change together, or distinct phases, are a pure reducer or union machine outside the component, with
  its own test (`features/review/study-session-machine.ts`, `features/quiz/quiz-machine.ts`). The component
  dispatches. A lone toggle stays `useState`.
- **A page with many acts exposes one hook,** `pages/<x>/model/use-<thing>.ts` (`use-library.ts`,
  `use-deck-questions.ts`). It composes the data, selection and action hooks inside, and is the page's test surface
  (`renderHook` over in-memory repositories).
- **What is open over a page is one union value, never a flag each:** one `PendingAct` with
  `request`/`dismiss`/`confirm` (`pages/deck-library/model/pending-act.ts`). A multi-step flow is a stage union
  (`DeleteAccountStage`). Separate booleans make "a dialog over a sheet" reachable.
- **One `set(key, value)`, not a setter per setting** (`use-study-settings.ts`).

<a id="s4"></a>

## 4. Composition

- No boolean-prop proliferation (`isPrimary`, `isCompact`). A choice a prop would make is its own component or its
  `children`.
- **Variants are lookup maps of complete class strings** (`shared/ui/primitives/button.tsx`). Never `` `bg-${x}` ``:
  Tailwind cannot see it. A value only known at runtime goes in `style`.
- Multi-part UI is a compound component sharing context, not a wide prop list (`Sheet`, `ActionSheet`,
  `SegmentedControl`). `children` over `renderX`; a render prop only when the parent injects per-item data.
- **React 19:** `ref` is a normal prop, no `forwardRef`.

<a id="s5"></a>

## 5. The kit, tokens and controls

**Tokens.** Tailwind v4: primitives (`--p-*`) and semantic roles in `src/styles/tokens.css`, exposed by `@theme` in
`src/styles/theme.css`.

- Semantic utilities only (`bg-primary`, `text-heading`, `rounded-control`, `shadow-rest`/`-interactive`/`-elevated`):
  never a primitive, a hex value or `p-[16px]`.
- **Compose with `cn()`** (`shared/lib/cn.ts`). It knows only the names declared there, so a new type, radius or
  elevation name in `theme.css` is added to `cn.ts` too (`cn.test.ts`), or `cn()` drops classes.
- **Type is five sizes:** `text-tiny` (10) · `text-label` (12) · `text-body` (14) · `text-title` (16) ·
  `text-headline` (20), plus `text-entry` (16) for a field. A row's title and the line under it differ by weight and
  colour, not a sixth size. Three scales are not type: `text-glyph-*` (an emoji filling a square), `text-figure-*` (a
  display number), `text-card-*` (the printed card's fluid ramp).
- **Radii are roles** (`rounded-field`, `rounded-control`, `rounded-tile`, `rounded-card-*`…; see `theme.css`), never
  Tailwind's own `rounded-md`/`-lg`. `rounded-full` is the pill.
- **No `dark:`.** Dark mode is the remap under `[data-theme='dark']`. Anything that picks a colour by scheme in script
  reads `data-theme` (`useColorScheme()`), never `prefers-color-scheme`: the learner's choice may differ from the OS.
- **Literal colours live only in the printed card styles** (`PRESETS` in `shared/lib/card-style/presets.ts`), each
  with a `dark` rendition of the same material. `CardScene` sets `data-scene`; `tokens.css` repaints `CHROME_TOKENS`
  there, a surface always with its ink (`scene-chrome.test.ts`). A face is opaque. Retiring a preset id is a migration.

**Surfaces.** `--bg` runs from lavender to white, so a surface on the page needs an edge, never a fill alone.
`cardSurface` (what a learner acts on) and `noteSurface` (what they read) in `shared/ui/primitives/card.tsx` are the
two panels. A tinted fill straight on the page is a status banner with its tone's border token; any other tint sits
inside a `bg-card` ancestor (`ToggleRow`'s `surface`). Check at the bottom of a long page.

**The header.** One frame, `shared/ui/header`. `Header` holds the safe area, the focus guard and what the bar is about
(title, subtitle, progress, back) on context; it paints nothing. `AppHeader` adds the `.chrome` paint, whose colour is
the status bar's (ADR 0007). Parts (`HeaderBar`, `HeaderBack`, `HeaderTitle`, `HeaderActions`…) read the context; a
one-off part calls `useHeader()`. Named compositions: `ScreenHeader`, `SelectHeader`, `StudySessionHeader`.

- No screen hand-rolls a `<header>`. Compose the parts, or add one.
- `HeaderBar` is `h-16` on every screen. Nothing stacks inside it: a study session's progress floats on the bottom
  edge, Match's score sits in the body. A selection swaps contents, never height.
- A study session uses `StudySessionHeader` (bare `Header`), so the card style's scene runs under it.
- `data-slot="header"` is a contract: `useKeyboardReveal` finds the reveal band by it (`CHROME`, `Header.test.tsx`).
- Elevation comes from `AppScreen`. Pages pass no ref and call no hook.

**Controls.**

- **44px targets.** `Button` `md`/`lg` and `IconButton` `md` meet it; a smaller drawn control grows its hit area with
  padding. Icon-only controls have an `sr-only` or `aria-label` name. Keep separable hit areas between neighbours.
- Every interactive element has hover, `focus-visible`, `disabled` and a transition. `focus-visible:` over `focus:`.
- **`outline-none` removes the ring** (Tailwind v4). Use it only on a popup container that takes focus by script, or a
  menu item drawn from `data-highlighted`; otherwise pair `focus-visible:outline-none` with a `focus-visible:ring-*`.
- **A control's footprint includes its states.** The ring draws `FOCUS_RING_OVERSHOOT` (5px) outside the box
  (`focus-ring.test.ts`). Siblings gap by at least `gap-2`. Any ancestor clip, mask or wipe insets outward by the ring
  in every pose (`HeaderSearch`: `inset(-5px …)`). Check focused, pressed, mid-animation and end pose.
- **Invisible is not absent.** A transparent overlay still takes the press: drive `pointerEvents` off the opacity, or
  `pointer-events-none`/`inert`. Test a swipe rail by pressing its button (`SwipeRow.test.tsx`).
- One primary action per screen, in thumb reach at the bottom. Destructive acts go behind `ConfirmDialog`.
- Contrast meets WCAG AA in both themes; large text never clips.

**Overlays** are Base UI, wrapped in `shared/ui`: `Sheet`/`PromptSheet` (a form, one field), `ActionSheet` (a few
choices), `FlyoutMenu`/`SortControl` (anchored menu), `ConfirmDialog` (blocking yes/no), `SpeedDial`. Bottom sheets over
centred dialogs; long content scrolls inside (`--sheet-max-h`). One overlay at a time, on the `--z-*` scale.

<a id="s6"></a>

## 6. TypeScript and imports

`import type` for types · no `any` (take `unknown` and narrow) · another slice only through its `index.ts` · the `@/`
alias across slices · never a dependency's `dist/`.

<a id="s7"></a>

## 7. Performance

- **`Promise.all` for independent async** in feature commands; sequential awaits only on a real dependency.
- **Subscribe narrowly:** `useXStore(selector)`, and a derived boolean (`selectIsReady`) over a raw array. State a
  handler reads only when it runs comes from `useXStoreApi().getState()`.
- **Entities keep their identity:** a repository returns the same object for an entity a write did not touch, and
  nothing edits one in place. So a list row is `memo`ized on its entity, with stable props: handlers take an id and
  come from `useStableHandlers`.
- **Long lists are windows** (`useListWindow` in `content-editor`, on `@tanstack/react-virtual` and the scroll element
  from `ScreenScrollContext`). A windowed row does not animate in.
- **Every screen is lazy:** `lazyRouteComponent` over an `app/routes/*-screens.tsx` module.
- **RxDB, Dexie and supabase-js stay off the first paint** (own chunks in `vite.config.ts`, `await import` in
  `createServices()`). A value import from `@/shared/api/supabase` or `@/shared/api/rxdb` under the entry fails
  `npm run check:entry-graph`; type-only imports are free.
- Keep FSD barrels; import large third-party libraries by name.
- **Stored images go through `useImageSrc`** (`DeckCover`, `Avatar`), never a URL minted in render. Reserve image
  space with `width`/`height` or `aspect-ratio`.
- Never define a component inside a component. Hoist static JSX and lookup maps.
- A ternary, not `cond && <X />` (a `0` renders).
- `startTransition` / `useDeferredValue` for costly non-urgent updates (deck and card search).
- Fonts ship latin and latin-ext only (`styles/fonts.css`): Workbox precaches every `woff2`.

<a id="s8"></a>

## 8. Build and PWA

- **The SPA rewrite ships for both hosts:** `vercel.json` `rewrites` and `public/_redirects`. Hashed assets are
  immutable; `index.html`, `sw.js` and the manifest revalidate (`vercel.json` `headers`).
- Check `npm run build && npm run preview` after touching startup, routing or the PWA (no service worker in dev). A
  `VITE_` variable is public.
- **Updates are never applied silently** (`registerType: 'prompt'`, never `autoUpdate`: a reload mid-study loses the
  learner's place). `UpdatePrompt` reads `registration.waiting`, not `updatefound`, and shows one toast with a fixed
  id.
- Manifest: `standalone`, `portrait`, colours `STATUS_BAR.light`, a maskable 512 icon.
- **Status bar:** `black`, painted by iOS from `theme-color` = `STATUS_BAR` (`shared/config/status-bar.ts`); never
  `black-translucent` ([ADR 0007](adr/0007-ios-paints-the-status-bar.md)). `useDeviceTheme` writes it only once
  preferences are ready.
- **Brand assets come from `shared/config/brand-mark.ts`** via `npm run brand:assets`; commit the output. The launch
  screen, the pre-script paint and the splash's first frame are one picture (`SPLASH_MARK_PX`).
- Test installed and in a tab: installed has no browser back, so every screen has its own.

<a id="s9"></a>

## 9. Motion

- `motion` is the library. Animate `transform` and `opacity` only.
- **Motion shows a change of place or state, or it goes.** Sheets rise and fall; no lateral slides between peers.
- 150–300ms for feedback in the page. A full-height surface travels further and takes longer: `Sheet` is 450ms on
  `cubic-bezier(0.32,0.72,0,1)`, and `data-swiping:duration-0` hands it to the finger. Easings live in
  `shared/lib/motion.ts`.
- Finger-driven motion is a spring on a `MotionValue` and can be reversed mid-gesture.
- **A value animates when it changes, not on every mount:** `Progress`' `animateOnMount` is opt-in.
- **Reduced motion:** script-driven motion asks `useReducedMotion()`; CSS transitions take `motion-reduce:`.

<a id="s10"></a>

## 10. Drag and drop

Why: [ADR 0001](adr/0001-drag-and-drop-and-card-stacks.md). This is the checklist.

- **A drag only reorders.** Re-parenting is `DestinationSheet`. The one exception: a deck dropped on a folder row
  files into it, and the row lights up first.
- **Every row a drag can reach is a peer.** Never add a drag to a surface that renders a hierarchy; flatten it first
  (`LibrarySelectList`).
- **All of it is `useSortableBlock()`** (`shared/lib`); rows go through `SortableRow`. The settings strips use
  `widgets/action-slots`' `useSortableList`. `LibrarySelectList` is the reference: move other surfaces to it.
- `dropAnimation` is `null`, and reorderable rows have no mount entrance.
- A multi-row pile is built from the real rows (`StackedDragPreview`), top = most recently selected, and lands with
  `useStackLanding()`.
- Card stacks (`StudyDeck`, `CardBrowser`) render the real next cards behind the front one with `DEPTH_POSE`, and key
  the front slot by card id. The queue is nearest-first: `depth={i + 1}`, never `length - i`.

**The four causes of drop flicker.** Check all four before adding a drag surface:

1. **The dropped state is not on screen the instant the finger lifts.** A reorder is one write per row, so the store
   re-emits half-applied states. Hold the drop until the rows agree (`useOptimisticPatch`, `useHeldOrder`,
   `reconcileHeldOrder`).
2. **The list is not sorted by `order`.** RxDB returns rows by primary key. Use `siblingDecks()`.
3. **`DragOverlay` is not the row it came from.** Share frame and body (`DeckRowBody`/`DeckDragPreview`); lift with a
   shadow, not `scale`.
4. **Something animates `opacity` on the landing row.** dnd-kit hides the source with inline `opacity: 0`; a mount
   entrance overwrites it.

<a id="s11"></a>

## 11. Layout, keyboard and safe areas

None of this shows in jsdom or on a desktop. Check `/dev/kitchen-sink`'s viewport probe before theorising; verify on a
phone. Why: [ADR 0002](adr/0002-keyboard-covers-the-app.md).

**Layout.**

- Mobile first, one centred column `max-w-app` (430px), never a raw width. `dvh`, never `vh`. `min-w-0` on flex
  children so text truncates.
- `overflow-*-auto` clips both axes: a sideways scroller keeps room for rings inside it with a net-zero pair
  (`-m-1.5 p-1.5`, `IconColorRow`).
- Every screen's scroll surface is built from `SCREEN_SCROLL` (`shared/lib`). Inner scrollers (a preview box, a popup
  list) are not.
- **A screen that fits does not scroll.** `AppScreen`'s gutter is `--screen-gutter`, and its sizers (`FILL`,
  `BOUNCE`) subtract it. A screen with a dock takes `flex-1`. The gutter is `0` under `data-keyboard`.

**Safe areas.** Use the named utilities (`.pt-safe`, `.pb-safe`, `.pb-keyboard`, `.pb-safe-keyboard`) and compose
`AppScreen`, `Sheet`, `Header` and `SpeedDial`; never hand-roll `env(safe-area-*)`. The top pads by `--safe-top`, `0`
when installed (ADR 0007).

**The keyboard.**

- **iOS pans; it does not resize.** `#root` is `height: var(--app-height)`, sampled while nothing is focused.
  `shared/lib/keyboard-viewport.ts` is the only `visualViewport` subscriber and publishes `--app-height`, `--kb-inset`,
  `--kb-range` and `data-keyboard`. It listens to `resize` only.
- **Nothing compensates for the pan; the pan is prevented.** The acceptance test: the header does not move when the
  keyboard opens. If it moves, ask why the reveal did not clear the field.
- **The scroll body reveals the focused field, and needs the range to do it.** `.pb-keyboard`/`.pb-safe` pad by
  `--kb-range`; `scroll-padding-bottom` stays `--kb-inset`. `useKeyboardReveal` scrolls on `focusin` and when the
  inset settles. `AppScreen` wires it; opt in by hand only on a scroll node it does not own (`AuthScreen`,
  `CardFace`). Never a global `focusin` listener (sheets scroll their own).
- `visibleBottom()` is the only bridge between viewport and rect coordinates. Everything else compares rects.
- The 120px keyboard floor is tested on the keyboard's height, not on the pan-reduced inset. Subscribers wake on every
  measured resize, not only when the inset moved.
- Before the keyboard reports itself, the reserve is the largest height measured (stored), published before the
  reveal scrolls. It is a bridge, never a floor: the first real measurement replaces it, and it ends there, not at
  blur.
- **A page footer has two places.** No keyboard: a flex sibling of the scroll body. Keyboard up: the last thing inside
  the scroll body, reached by scrolling, and `AppNav` hides. An action that must survive typing goes in the header
  (`CardEditorPage`'s Save). Keep a footer mounted in every state the page passes through; disable its button
  instead.
- Bottom insets measured from the screen never subtract `--kb-inset`.
- **`--app-bottom-inset` is space reserved; `--toast-inset` is chrome cleared.** A floating layer clears what
  `useBottomChrome()` measured (`AppScreen`'s footer, `BottomDock`, `SpeedDial`), published as `--bottom-chrome`.
  Claim the untransformed outer box; never a guessed height.
- **A sheet's pinned footer consumes `--drawer-keyboard-inset`** through `.pb-safe-keyboard`. Combine safe-area and
  keyboard insets with `max()`, never `+`.
- **Focus a sheet's field through `Sheet`'s `initialFocus`, never `autoFocus`** (lint-banned in `*Sheet.tsx` and
  `*Form.tsx`). Do not autofocus a full-page field either.
- **A control tapped while a field is focused must not take focus,** or the keyboard drops and the tap lands on
  nothing. `keepFieldFocused` does it; `Header`, `FooterBar`, `DrawerHeader` and `DrawerFooter` install it.
- **A sheet never pre-selects a field's text.** iOS taps into the selection and pans the whole app. A suggested value
  is the placeholder and the fallback (`PromptSheet`'s `suggestion`).
- Fields set `inputMode`, `type`, `autocomplete` and `enterKeyHint` (`next` between fields).

**Touch.** `overscroll-behavior: contain` on scroll regions. Swipe surfaces set `touch-action`: chrome
`touch-none select-none`, the scroll body `touch-auto`. `DrawerContent` clears a text selection before a drag
(`clearSelectionForDrag`).

<a id="s12"></a>

## 12. Gestures

- **One surface owns the finger at a time:** `useGestureHold` (`shared/lib/gesture-hold.ts`) is the registry. A
  surface claims when it starts moving, holds while displaced, and spreads the hook's `surface` bundle; the next claim
  puts the previous holder back first.
- Horizontal swipes are `@use-gesture` with `axis: 'x'` and `touch-action: pan-y`; commit maths in
  `shared/lib/gestures`. Sheets never hand-roll drag: Base UI `Drawer` owns swipe-to-dismiss.
- **A frame is `tap`, `moving`, `released` or `canceled`** (`dragFrame`). A cancel never commits.
- **Throws resolve per axis** (`resolveFling`, `resolveThrow`), never "the fastest axis". A locked axis still reads
  the other one (`lockedTo`).
- Clear the click guard on a real `pointerdown`, not on the engine's first frame.
- Never re-render a row from a motion value during a drag.
- Every gesture has a visible alternative; never rely on hover. Haptics (`shared/lib/haptics`) are a preference and
  do nothing on iOS Safari.

<a id="s13"></a>

## 13. States and offline

- **Every surface handles loading, error, empty and offline.** Loading: `ScreenLoading`/`Skeleton`, never blank; the
  splash covers first paint. Error: the problem and a way to retry; a database that will not open shows `Bootstrap`'s
  error screen. Empty: `Empty` (`panel`/`hero`), or one line of `EmptyNotice` inside a settings-style list.
- **Local writes are instant:** no fake loading. Disable a submit while it is pending.
- **Reads never touch the network.** RxDB is the source of truth.
- **Gate only what the server must answer now** ([ADR 0004](adr/0004-what-needs-the-network.md)): `OfflineNotice` and
  a disabled control, before the press. Every content write stays ungated.

<a id="s14"></a>

## 14. Copy and i18n

- Every UI string is a key in `shared/i18n/locales/en/`, one file per domain; an extension keeps its own
  (`extensions/<x>/i18n/`). Keys are typed (`i18next.d.ts`), so a missing one fails `tsc`.
- Counts use i18next plurals (`_one`/`_other`).
- Words come from [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md): "Synchronise" in copy, "Mastered" for `known`.
- Empty states and errors get one short line. A sentence that repeats a label goes.

<a id="s15"></a>

## 15. Tests

- Tests sit beside their file (`*.test.ts(x)`), Vitest on jsdom, `globals: false`: import `describe`, `it`,
  `expect`, `vi` from `vitest`. A test names behaviour a learner or caller sees.
- Pure logic in `shared/lib` and `entities/*/model` by unit tests; a page's hook by `renderHook`; components by role and
  accessible name with `userEvent`. No snapshots.
- **Fakes over module mocks:** `InMemoryRepository`, stores started with `shared/test/started.ts`,
  `renderWithProviders`, `fake-cache-storage`, `features/sync/testing/fake-cloud.ts`. A new repository adapter runs
  `runRepositoryContract`.
- jsdom lays nothing out: `shared/test/setup.ts` sizes only the scroll element and windowed rows.
- Synthetic pointer events need a `pointerType`, or `@use-gesture` never fires.
