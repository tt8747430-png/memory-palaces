# Code Style

Components in Mindscape. Builds on [CLAUDE.md](../CLAUDE.md) — read that first. Every rule names a file that already does it right; match that shape. Mobile/PWA behavior → [MOBILE_DESIGN.md](MOBILE_DESIGN.md).

Goal: small, single-responsibility, reusable. 500 lines in one component → decompose, don't leave it.

---

## 1. Compose small components

Container wires data → presentational children (section → list → item). One job each.

| What                            | Where                                         |
| ------------------------------- | --------------------------------------------- |
| App-wide, purely presentational | `shared/ui/` (`Sheet`, `GlassCard`, `Button`) |
| Composite, tied to one screen   | `widgets/<x>/ui/`                             |
| Screen root                     | `pages/<x>/ui/`                               |
| Subpart of one parent           | beside it, same `ui/` folder                  |

Reference: [`widgets/study-session/ui/`](../src/widgets/study-session/ui/) — ~11 focused files + `model/` + barrel.

- ~200 lines/file soft budget. Past it, extract children — or check the excess is really _state_ belonging in `model/` (§3a).
- **One exported component per file, named for the file.** Two peers in one file hides their duplication. Private helpers stay.
- A page composes widgets + `shared/ui`; little markup of its own.
- Promote to `shared/ui` **only when app-wide and presentational**.

## 2. Logic into hooks; components render

- Stateful/effectful logic (subscriptions, gestures, timers, DOM measurement) → a hook. Reusable ones in `shared/lib` ([`use-long-press`](../src/shared/lib/use-long-press.ts), [`use-sticky-header`](../src/shared/lib/sticky-header/use-sticky-header.ts), `use-sortable-sensors`, `gestures`, `haptics`); one-offs colocate.
- **Pure domain logic never lives in a component or hook** — `shared/lib` or `entities/*/model`, unit-tested without React.

## 3. Complex state → reducer / machine

- Several pieces changing together, or distinct phases → reducer or discriminated-union machine, kept **pure and outside the component** in feature/model: [`features/review/session-machine.ts`](../src/features/review/session-machine.ts), [`features/quiz/quiz-machine.ts`](../src/features/quiz/quiz-machine.ts) (each `*.test.ts`). Component dispatches.
- `useReducer` for multi-field interdependent UI state (`QuizSession`, `MatchBoard`, `FlashcardsPanel`).
- Lone toggle stays `useState`.

## 3a. A page's state lives in one module

A page reading several stores + holding a Selection + doing a dozen acts presents **one** interface to its JSX, in `pages/<page>/model/use-<thing>.ts`. Reference: [`use-library.ts`](../src/pages/deck-library/model/use-library.ts), [`use-deck-questions.ts`](../src/pages/deck-questions/model/use-deck-questions.ts).

- **Compose internally, expose one surface.** `useLibrary` = data + selection + actions hooks — seams for its own tests, invisible to the page. Anything the page can't act on (optimistic overlay, which store a setting writes to) stays inside.
- **The interface is the test surface** — `renderHook` over in-memory repos, not by rendering the page. A test reaching past it means the module is the wrong shape.
- **Confirmations are one `pending` value, never a flag each.** One `PendingAct` union + `request`/`dismiss`/`confirm`; separate booleans make "delete dialog over the move sheet" reachable.
- **One `set(key, value)`, not a setter per setting** — [`use-study-settings.ts`](../src/widgets/study-session/model/use-study-settings.ts) cut `GearSheet` 27 props → 7 and hid which store each lands in.

## 4. Composition over configuration

- **No boolean-prop proliferation** (`isPrimary`, `isCompact`, `hasIcon`…) → variant components or `children` slots.
- **Variants = lookup maps of complete static strings** ([`button.tsx`](../src/shared/ui/button.tsx)). Never `` `bg-${x}` `` — Tailwind can't see it.
- **Compound components for multi-part UI** — subcomponents sharing state via context, not a wide prop list (`Sheet`, `ActionSheet`, `SegmentedControl`). Provider owns state.
- **`children` over `renderX`** — render props only when the parent injects per-item data.
- **One component + `as` prop**, not `Button` + `LinkButton` + `IconButton`.
- **React 19:** `ref` is a normal prop — **no `forwardRef`** (repo has zero). Prefer `use(Context)` in new code.

## 4a. One header chrome

[`shared/ui/HeaderBar`](../src/shared/ui/HeaderBar.tsx) — safe-area inset, glass, **fixed `h-16`**, shadow fading in on scroll. Four fillers: `ScreenHeader`, `SelectHeader`, `HomeHeader`, `ProfileBar`.

- **No screen hand-rolls a `<header>`** — need more, add a slot to the closest one. Bespoke bars are how the heights drifted.
- **Controls: `IconButton variant="glass"` at `md` (44px)**; text buttons beside them `Button size="md"` (same 44px).
- **Elevation comes from `AppScreen`** (owns the scroller, publishes `HeaderElevationContext`). Pages pass no ref, call no hook.
- **A selection swaps contents, never size** — the list must not jump.

## 5. Tailwind

v4, two-layer tokens: primitives (`--p-navy-900`…) → semantic roles (`--primary`, `--card`, `--border`…) in [`tokens.css`](../src/styles/tokens.css), exposed via `@theme` in [`theme.css`](../src/styles/theme.css).

- **Compose with [`cn()`](../src/shared/lib/cn.ts)** — resolves conflicting utilities; template concatenation doesn't.
- **Never build class names dynamically** — lookup map of full static strings, or inline `style` for genuinely dynamic values.
- **Semantic tokens, not raw values.** `bg-primary`, `text-heading`, `rounded-control`, `shadow-rest` — not `bg-[#091A7A]`, not `p-[16px]`. No alias yet → CSS var.
- **Dark mode is automatic** (`[data-theme='dark']` remap). No scattered `dark:`, no hardcoded light/dark colors.
- **Interactive elements need hover / `focus-visible` / `disabled` + `transition`.** Icon-only → `sr-only` label. `focus-visible:` over `focus:`.
- **Mobile-first** — base = smallest screen, layer upward. Verify at phone width.

## 6. TypeScript & imports

`import type` for type-only imports · no `any` (`unknown`) · cross-slice through `index.ts` only · `@/` alias, never deep relative paths across slices.

## 7. Performance (React core)

Ordered by impact.

- **`Promise.all` for independent async** — the norm in feature commands. Sequential awaits only on true dependency.
- **Subscribe narrowly** — smallest slice via `useXStore(selector)`; prefer a derived boolean (`selectIsReady`) over a raw array. State used only in a callback → `useXStoreApi().getState()` at call time.
- **Memoize deliberately** — `useMemo` for real derivations; `React.memo` around an expensive child under a hot parent.
- **Split routes with `React.lazy` + `Suspense`** — `app/router.tsx` still imports ~30 pages eagerly. Same for heavy, rarely-opened widgets.
- **Keep FSD barrels** — they're our public API. The tree-shaking caveat is about _third-party_ barrels: import large libs by name; no intra-slice re-export chains pulling in heavy modules.
- **Reserve image space (CLS)** — explicit `width`/`height` or `aspect-ratio`.
- **Never define a component inside a component** — it remounts every render.
- **Derive during render, don't mirror state with effects.** `useEffect` = outside-world sync; interaction logic in handlers.
- **Passive scroll/touch listeners.** Horizontal swipes use **`@use-gesture`** (`axis: 'x'` + `touch-action: pan-y`), commit math in `shared/lib/gestures`; sheets never hand-roll drag (Base UI `Drawer` owns swipe-to-dismiss).
- **`startTransition` / `useDeferredValue`** for expensive non-urgent updates (deck/card search).
- **Ternary, not `cond && <X/>`** (falsy `0`/`''` renders as text). Hoist static JSX. `content-visibility`/windowing for long lists.
- **JS micro-perf stays in `shared/lib`** (`Map`/`Set`, `toSorted()`, early exit) where it's tested.
- **Server state (future):** when a cloud layer lands, use a query library, not ad-hoc `useEffect` + `useState`.

## 8. Vite build & SPA deploy

- **SPA fallback rewrite is mandatory — currently missing.** Without it, deep-linking `/deck/123` 404s. Add `public/_redirects` (`/* /index.html 200`) or `vercel.json` `rewrites` before deploying.
- **Hashed assets immutable, `index.html` `no-cache`.** Workbox handles the SW layer; host headers must agree.
- **Validate with `npm run build && npm run preview`** — catches base-path, lazy-chunk and asset issues `dev` hides.
- **`VITE_` prefix = public.** Never a secret in one.
- **Never import a dependency's `dist/`** — double-bundles, breaks dedup.

## 9. Animation

- **`motion` is the library** — animate `transform`/`opacity` only; layout props reflow and drop frames.
- **Every animation means something** — spatial relationship or state change. Honor `prefers-reduced-motion`.
- **View Transitions API — not adopted** (needs `react@canary`, overlaps `motion`). Adopt deliberately per skill, never ad hoc.

## 10. Drag & drop (`@dnd-kit`)

> _Why_ → [ADR 0001](adr/0001-drag-and-drop-and-card-stacks.md). This is the checklist.

**A drag only ever reorders.** Re-parenting is an explicit act with its own surface (`MoveDeckSheet`) — a drop is a guess about a finger. One exception: a deck released over a folder row files into it, and the row lights up before the finger lifts.

**Every row a drag can reach must be a peer.** "Rows make room" promises a reorder. So select mode is a flat list of folders + top-level decks (`LibrarySelectList`) and the nested `DeckTree` doesn't drag at all. **Never add a drag to a surface rendering a hierarchy.**

**The four causes of drop flicker** — check all before adding a drag surface:

1. **Dropped state not true on screen the instant the finger lifts.** Reorders are one RxDB write per row, so the store re-emits half-applied states. Hold the drop until persisted rows agree — `useOptimisticPatch` (covers `order` **and** a move's `parentId`/`folderId`), or a working copy from props (`reconcileHeldOrder`).
2. **List not sorted by `order`.** RxDB returns rows by primary key → the list silently ignores the reorder it just persisted. Use `siblingDecks()`; folders by their `order`.
3. **`DragOverlay` isn't the row it came from.** Different size/padding/missing control morphs on drop. Share frame and body (`DeckRowBody`/`DeckDragPreview`, `Tile`); carry the lift with **shadow, not `scale`**.
4. **Something animates `opacity` on the landing row mid-flight.** dnd-kit hides the source with inline `opacity: 0`; a mount entrance overwrites it and you see the deck twice. Suppress entrances, or `dropAnimation={null}`.

**Multi-row drag** — one pile in hand, one block on the ground: lands contiguously (`moveBlock()`, after the target from above, before from below); carried rows leave the list so exactly one gap opens at the block's edge; the pile is built from **real rows** (`StackedDragPreview`), top = most recently selected; no drop animation — `useStackLanding()` FLIPs each row on the compositor, nothing under `prefers-reduced-motion`.

**All of it is `useSortableBlock()` (`shared/lib`) — don't rewrite it.** Headless; owns carry, pile, landing, drop placement, plus the two settings that must not vary (`drag.collision` → `DndContext`, `drag.dropAnimation` → `DragOverlay`). A surface supplies `sectionOf`, optional `scopeTo`, and markup. Rows go through `SortableRow`, which keeps the frame as the row's own element — that's what `opacity-0` and the landing apply to. Settings pages keep their own `DndContext` on purpose (horizontal single-item assignment ≠ reorder).

**`LibrarySelectList` is the reference — move other surfaces to it, never it to them.** Two rules easy to "improve" and not to be: `dropAnimation` is `null`, and reorderable rows have **no mount entrance**.

**Card stacks follow the same rule: build from the real items.** `StudyDeck`/`CardBrowser` render the real upcoming cards behind the current one — inert, `pointer-events-none`, shared `DEPTH_POSE` — and key the front slot by card id, so the arriving card rises out of the deck. Never a blank rectangle: a placeholder can't animate into the thing it stands for.

**Queued list is nearest-first: `depth={i + 1}`, never `length - i`.** Inverted, you peek at card 15, swipe, and 14 arrives. Only visible in motion — both stacks carry a `z-index` regression test. Shipped inverted once; don't re-derive by eye.

## 11. Styling traps — invisible on desktop, real on device

jsdom and a desktop dev server render no keyboard, no iOS selection gesture, no clipped ring. Preview edge states at dev-only **`/dev/kitchen-sink`**.

- **`overflow-*-auto` clips _both_ axes** — a horizontal scroller cuts the selected item's ring/shadow at every edge. Reserve room inside the scrollport with a net-zero pair (`-m-1.5 p-1.5`, `IconColorRow`). Not `overflow-visible` — that kills the scroll.
- **iOS pans; it does not resize** ([ADR 0002](adr/0002-keyboard-covers-the-app.md)). The layout viewport keeps its height, the visual viewport shrinks, and Safari slides it down (`visualViewport.offsetTop`) to reveal the focused field, holding that pan until blur — so a `position: fixed` app rides off the top of the screen. `interactive-widget` is unimplemented in WebKit as of iOS 26, so the meta in `index.html` is inert there and this is handled in JS or not at all. **Verify against `/dev/kitchen-sink`'s viewport probe before theorising** — three fixes shipped on inference here, each wrong.
- **Anchor the shell, and measure against the anchor.** `#root` is `height: var(--app-height)` — the layout viewport sampled while no field is focused, re-anchored only on rotation or growth. Every keyboard number is derived from it, never from live `clientHeight`, so a platform that _does_ resize can't collapse the measurement to zero. `useKeyboardInset` publishes `--kb-inset` (≥120px, so an accessory bar alone doesn't count) plus `--vv-top`, and is the only `visualViewport` subscriber.
- **`visualViewport.offsetTop` and `getBoundingClientRect()` are different coordinate spaces — and fixed-element behavior depends on display mode.** In a Safari _tab_ WebKit re-anchors `position: fixed` to the visual viewport while the keyboard is up, so the app does not ride off-screen; in the **standalone PWA it does not**, and the fixed shell rides off the top by the full pan ([ADR 0002](adr/0002-keyboard-covers-the-app.md)). The only compensation is `theme.css`'s `translate` of `[data-slot="header-bar"]`/`[data-slot="status-cap"]` by `--vv-top`, gated on `(display-mode: standalone)` + `[data-keyboard]` — translating in-tab double-counts the pan and dives the header over the content. `visibleBottom()` (`= --app-height − --kb-inset − --vv-top`) is the one sanctioned JS bridge; everything else in `useKeyboardReveal` is rect-vs-rect.
- **A focused field is revealed by its scroll body, and that needs range, not just `scroll-padding`.** `useKeyboardReveal` sets `scrollTop` on `focusin` and again when `--kb-inset` settles; `.pb-keyboard`/`.pb-safe` give the scrollport `padding-bottom: var(--kb-inset)` to scroll into. `AppScreen` wires it automatically — opt in by hand only on a scroll node it doesn't own (`AuthScreen`, `CardFace`), and **never as a global `focusin` listener**: Base UI sheets already scroll their own fields and the two would fight. `focusin` fires before the keyboard reports itself, so the reserved height is the last one measured, persisted to `localStorage`.
- **A page footer is `sticky bottom-0` inside the scroll body — a header, upside down — and goes `static` while the keyboard is up.** Content passes behind it; it comes to rest at its flow position at the end of the scroll. WebKit re-clamps bottom-anchored sticky boxes to the visual viewport when the keyboard shows — the dock would float above the keyboard mid-screen — so `FOOTER_DOCK` carries `[[data-keyboard]_&]:static` (`useKeyboardInset` publishes the `data-keyboard` attribute with `--kb-inset`), leaving the CTA at the end of the page, behind the keyboard until scrolled to. Pin to a scrollport something can shrink and it lands on the keyboard's edge instead.
- **Bottom insets measured from the screen must subtract `--kb-inset`** (`--app-bottom-inset`). A home-indicator gutter is clearance; with the keyboard over that area it is a dead band under the footer's controls.
- **A sheet's pinned footer must consume `--drawer-keyboard-inset`; the body doesn't lift it.** Base UI's `VirtualKeyboardProvider` never moves the sheet, so a `bottom-0` footer stays behind the keyboard → pad the popup with `.pb-safe-keyboard`. **Combine safe-area and keyboard insets with `max()`, never `+`** (the inset already measures to the accessory bar). Insets measured from the bottom (`--app-bottom-inset`, `.pb-safe`, `.pb-gutter`) must never _subtract_ `--kb-inset` — nothing shrinks any more, so that only makes bottom chrome twitch on keyboard open.
- **Focus drawer fields via `Sheet`'s `initialFocus`, never native `autofocus`.** `autofocus` fires before Base UI positions the sheet and without `preventScroll` → iOS scrolls the whole layout, skewing `offsetTop` and corrupting the keyboard measurement. **Lint-banned in `*Sheet.tsx`/`*Form.tsx`.** Don't reach for it on full-page inputs either: it opens the keyboard over the page's own footer before the learner has seen it, and the mount-time pan lands before any keyboard height has been measured (removed from `PasteNotesPage`).
- **A control tapped while a field is focused must not steal focus** — iOS blurs the field, the keyboard drops, the footer slides out from under the finger and the `click` lands on nothing (tap swallowed). `onMouseDown={(e) => e.preventDefault()}` on the control; toggle still fires, keyboard nav unaffected. `DrawerHeader`/`DrawerFooter` already do it (`keepFieldFocused`), skipping the guard when the tap lands in another field.
- **Swipe surfaces need `touch-action`, or text selection hijacks the drag.** Base UI declines its swipe while text is selected, and without `touch-action: none` the browser scrolls instead. Chrome is `touch-none select-none`; the scroll body re-enables `touch-auto overscroll-contain`. The selection must be collapsed before the touch reaches the Popup — `DrawerContent` clears it for the whole interior, leaving fields and `.allow-select` alone (`clearSelectionForDrag`). `useAutoSelect` is the usual source.

**Verify on a real device** whenever a change touches: `overflow-*`/scroll · keyboard · focus/autofocus · `env(safe-area-*)` · gestures/`touch-action`.
