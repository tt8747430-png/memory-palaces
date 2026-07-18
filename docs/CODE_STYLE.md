# Code Style

Conventions for writing components in Mindscape. These build on the architecture in [CLAUDE.md](../CLAUDE.md) (feature areas, entity stores, commands) — read that first. Each rule below points at a real file in the repo that already does it right; match that shape.

The goal: small, single-responsibility, reusable pieces. When AI (or a human) drops 500 lines into one component, decompose it using the rules here rather than leaving it.

Mobile-specific and PWA behavior guidelines (touch targets, thumb zone, gestures, safe areas, offline-first, install/update) live in a separate doc: [MOBILE_DESIGN.md](MOBILE_DESIGN.md).

---

## 1. Compose small components; don't build monoliths

Split a screen into single-responsibility parts: a container that wires data, then presentational children (section → list → item). One job per component.

**Where each piece lives (feature-area placement):**

| Piece                                          | Home                                                |
| ---------------------------------------------- | --------------------------------------------------- |
| Reusable across the app, purely presentational | `shared/ui/` (e.g. `Drawer`, `GlassCard`, `Button`) |
| Composite UI tied to one feature area          | `<area>/ui/` (e.g. `decks/ui/deck-tree.tsx`)        |
| Screen root                                    | `<area>/pages/<x>-page.tsx`                         |
| A subpart used only by one parent              | next to that parent in the same folder              |

**Good example — [`decks/ui/`](../src/decks/ui/):** the area's composite UI is split into `deck-tree`, `home-header`, `folder-form`, `folder-drawer`, `move-deck-drawer`, `study-overview-card`, `card-maturity-overview` — each focused, composed by the page, behind a public [`index.ts`](../src/decks/ui/index.ts) barrel.

**Rules of thumb:**

- Soft budget ~200 lines per component file. When a file passes that, extract children. Judge the **component** by its markup, not the file: [`deck-library-page.tsx`](../src/decks/pages/deck-library-page.tsx) is 521 lines of almost pure JSX composition, with its logic in a VM hook — that is the shape to copy, not a violation.
- A page composes area UI and `shared/ui`; it should not hold much presentational markup itself.
- Extract a component to `shared/ui` **only when it's genuinely app-wide and presentational** — don't hoist a one-off. A subpart reused within a single area stays in that area's `ui/`.

## 2. Extract logic into hooks; keep components rendering

Stateful/effectful logic (subscriptions, gestures, timers, DOM measurement) belongs in a hook, not inline in JSX. The component reads the hook's result and renders.

- **Reusable** hooks live in `shared/lib`: [`use-long-press`](../src/shared/lib/use-long-press.ts), [`sticky-header/use-sticky-header`](../src/shared/lib/sticky-header/use-sticky-header.ts), [`use-optimistic-patch`](../src/shared/lib/use-optimistic-patch.ts), `use-sortable-sensors`, `use-keyboard-pin`, `use-now`. One-off hooks colocate with their component.
- **Pure domain logic never goes in a component or hook** — it lives in [`shared/domain`](../src/shared/domain/) (`srs`, `streak`, `stats`, `deck-tree`, `order`, `naming`, `gestures`, `haptics`, `drop-zone`) or an area's `model/`, where it is unit-tested independently of React. The split is the point: `shared/lib` is React (hooks), `shared/domain` is not (pure TS).

## 3. Complex local state → reducer / state machine, not a pile of `useState`

When several pieces of state change together or a feature has distinct phases, model it as a reducer or a discriminated-union state machine instead of many `useState` calls.

- Keep the machine **pure and outside the component**, in the owning area's `commands/`: [`study/commands/session-machine.ts`](../src/study/commands/session-machine.ts), [`practice/commands/quiz-machine.ts`](../src/practice/commands/quiz-machine.ts), [`practice/commands/match-machine.ts`](../src/practice/commands/match-machine.ts) (each with a colocated `*.spec.ts`). The component just dispatches.
- `useReducer` is the right call for multi-field, interdependent UI state — pair it with one of the machines above rather than hand-rolling transitions in the component.
- **This is what keeps a VM from being earned** (ADR-0008): a page whose state already lives in a tested machine has nothing left for a ViewModel to hold.
- A lone toggle or a single value is still fine as `useState` — don't over-engineer.

## 4. Composition over configuration

From the `vercel-composition-patterns` skill. Build flexible components by composing, not by piling on boolean props.

- **Avoid boolean-prop proliferation.** When a component sprouts `isPrimary`, `isCompact`, `hasIcon`, `showHeader`… it's doing too many jobs. Split into explicit variant components, or expose slots via `children`, instead of branching on flags internally.
- **Variant styling via lookup maps of complete static strings.** See [`shared/ui/button.tsx`](../src/shared/ui/button.tsx): `variantStyles` / `sizeStyles` are `Record<Variant, string>` maps. Never assemble a class from `` `bg-${x}` `` — the Tailwind compiler can't see it (§5).
- **Compound components for multi-part UI.** For a component with coordinated parts (a drawer with header/body/actions), expose subcomponents that share state through context rather than a wide flat prop list — see [`shared/ui/drawer.tsx`](../src/shared/ui/drawer.tsx), the repo's worked example. The provider owns the state; children read it. This is the same provider-owns-state shape the services layer uses (`shell/services-provider.tsx`).
- **Prefer `children` over `renderX` props.** Pass composition through `children`/slots, not `renderHeader`/`renderItem` callbacks — reserve render props for when the parent must inject per-item data.
- **Polymorphism for element changes.** When the same UI must render different elements (`<button>` vs `<a>` vs a router `Link`), add an `as` prop to one component rather than shipping `Button` + `LinkButton` + `IconButton`.
- **React 19 conventions:** `ref` is a normal prop — **don't use `forwardRef`** (the repo has zero; keep it that way). Prefer `use(Context)` over `useContext(Context)` in new code.

## 5. Tailwind

This repo is Tailwind **v4** with a two-layer token system: primitives (`--p-navy-900`, …) → semantic roles (`--primary`, `--card`, `--border`, `--danger-surface`) in [`src/styles/tokens.css`](../src/styles/tokens.css), exposed to Tailwind via `@theme` in [`theme.css`](../src/styles/theme.css).

- **Compose classes with [`cn()`](../src/shared/lib/utils.ts)** (clsx + tailwind-merge), never template-literal concatenation — `cn()` resolves conflicting utilities deterministically; `` `p-4 ${cond && 'p-6'}` `` does not.
- **Never construct class names dynamically.** Use a lookup map of full static strings (like `button.tsx`), or an inline `style` for truly dynamic values (user-set color, computed position).
- **Use semantic tokens, not raw values.** `bg-primary`, `text-heading`, `bg-card`, `border-border`, `rounded-control`, `shadow-rest` — not `bg-[#091A7A]`, not `p-[16px]` where `p-4` exists. Reach for a CSS var (`var(--danger-surface)`) when there's no utility alias yet. The scale is **rem-based** so the OS text-size setting scales the whole app (ADR-0011) — never reintroduce a px token.
- **Dark mode is automatic via tokens.** Semantic tokens remap under `[data-theme='dark']` in `tokens.css`. Do **not** scatter `dark:` variants or hardcode light/dark colors in components — pick the semantic token and both themes follow.
- **Interactive elements need states.** hover / `focus-visible` / `disabled` + a `transition`, as in `button.tsx`'s `base` string. Icon-only buttons need an `sr-only` label; use `focus-visible:` (keyboard) over `focus:`.
- **Mobile-first & responsive.** Base styles target the smallest screen; layer `sm: → md: → lg:` upward. This is a portrait-first PWA — verify at phone width.

## 6. TypeScript & imports

Covered in [CLAUDE.md](../CLAUDE.md); the load-bearing ones: use `import type` for type-only imports (`verbatimModuleSyntax`), no `any` (use `unknown`), cross-area imports go through the area's `index.ts` barrel only, and use the `@/` alias — never deep relative paths across areas. Intra-area imports stay relative.

## 7. Performance (React core)

From the `vite-react-best-practices` skill (React-core rules), grounded in this repo. Ordered by impact.

- **Parallelize independent async — don't await in sequence.** Use `Promise.all` for independent reads/writes; this is already the norm in commands ([`decks/commands/delete-deck.ts`](../src/decks/commands/delete-deck.ts), [`decks/commands/reorder-cards.ts`](../src/decks/commands/reorder-cards.ts)). Await sequentially only when one call truly depends on the previous — bulk moves do, because each derives its `order` from the destination's current siblings.
- **Subscribe narrowly.** Bind the smallest observable you need with [`useStore()`](../src/shared/data/use-store.ts), and prefer a **derived boolean** over a raw array when you only need readiness. Don't bind state you only use inside a callback — read it at call time with the observable's direct call form (`store.decks()`), which doesn't subscribe.
- **Memoize deliberately.** `useMemo` for expensive derivations belongs in the VM hook, where the derived read models live — keep it for real work, not trivial values. Reach for `React.memo` to wrap an expensive child when a hot parent (a deck list, a study session) re-renders frequently.
- **Split routes with lazy imports.** [`routes.tsx`](../src/routes.tsx) uses React Router's `lazy:` per route, so each page is its own chunk — follow that pattern for every page you port, and for heavy, rarely-opened UI.
- **Barrels — the one deliberate exception to the "avoid barrel imports" rule.** Feature-area `index.ts` barrels are our required public API; **keep them.** The tree-shaking caveat applies to _third-party_ barrels: import large libs by name (`import { X } from 'lucide-react'` — already done), and don't add re-export chains inside an area that pull in unrelated heavy modules.
- **Reserve space for images (CLS).** Set explicit `width`/`height` or an `aspect-ratio` on `<img>` so late-loading images don't shift layout — applies to [`shared/ui/avatar.tsx`](../src/shared/ui/avatar.tsx) (the app's only `<img>`) and any cover art added later.
- **Don't define components inside components.** A component declared in another's render body remounts every render (state loss + churn) — hoist it to module scope, or pass it via `children`.
- **Derive during render; don't mirror state with effects.** Compute values from props/state inline or with `useMemo`. Reserve `useEffect` for syncing with the outside world, and put interaction logic in event handlers, not effects.
- **Passive listeners for scroll/touch.** Register scroll/touch listeners with `{ passive: true }` so they don't block scrolling — matters on the gesture/swipe surfaces ([`shared/domain/gestures.ts`](../src/shared/domain/gestures.ts), [`shared/ui/swipe-row.tsx`](../src/shared/ui/swipe-row.tsx)).
- **Keep input responsive with concurrent features.** Wrap expensive, non-urgent updates (filtering/searching decks and cards) in `startTransition` or `useDeferredValue`.
- **Rendering hygiene:** conditional render with a ternary (`cond ? <X/> : null`), not `cond && <X/>` (a falsy `0`/`''` renders as stray text); hoist static JSX out of render; use CSS `content-visibility` or windowing for long deck/card lists.
- **JS micro-perf stays in `shared/domain`** where it's unit-tested: `Map`/`Set` for repeated lookups, `toSorted()` for immutable sorts, early-exit. Don't inline these into components.
- **Server state (future):** there's no backend yet — reads come from local RxDB. When a cloud/REST layer lands, route server state through a query library (React Query/SWR) for dedup + caching, not ad-hoc `useEffect` + `useState`.

## 8. Vite build & SPA deployment

From the `vite-react-best-practices` skill's Vite-SPA rules. This is a client-routed SPA (React Router v8) shipped as a PWA — these are non-negotiable for a correct production deploy.

- **SPA fallback rewrite is mandatory — and currently missing.** With client-side routing, the host must rewrite unknown paths to `/index.html`, or refreshing/deep-linking a route like `/deck/123` returns a 404. Add the host's rewrite before deploying (`public/_redirects` → `/* /index.html 200` for Netlify, or `vercel.json` `rewrites` for Vercel). No such config exists in the repo yet.
- **Cache hashed assets immutably, never `index.html`.** Vite fingerprints `assets/*` filenames — serve those `Cache-Control: public, max-age=31536000, immutable`, but serve `index.html` `no-cache` so new deploys are picked up. (The `vite-plugin-pwa` Workbox precache already handles this at the SW layer; the CDN/host headers must agree.)
- **Validate the production build before pushing:** `npm run build && npm run preview`. `preview` serves the real built output — it catches base-path, lazy-chunk, and asset issues that `npm run dev` hides.
- **Env vars: `VITE_` prefix = public.** Only `import.meta.env.VITE_*` (and `DEV`/`PROD`/`MODE`) reach the client bundle; anything without the prefix is stripped. Never put a secret in a `VITE_` var — it ships to every user.
- **Never import from a dependency's `dist/`** — import the package entry so it's bundled once and tree-shaken; deep `dist` imports double-bundle and break dedup.

## 9. Animation

**Two animation systems coexist by design (ADR-0012). The boundary is not an accident — respect it.**

- **Route boundaries use the View Transitions API.** Cross-page morphs are driven by React Router's `viewTransition` navigation flag; the transition itself is authored in CSS in [`src/styles/theme.css`](../src/styles/theme.css) (`::view-transition-old/new(root)`, plus `view-transition-name` on shared elements like a deck cover). This is where `motion` is structurally weakest — `AnimatePresence` must keep the outgoing page mounted — so it does not compete here.
- **Everything inside a page uses `motion`** (17 files) — gestures, drag, drawers, list reorder, mount/exit within a route. Reach for it, don't hand-roll. Animate GPU-friendly properties (`transform`, `opacity`), not layout props (`width`, `height`, `top`, `margin`), which force reflow and drop frames.
- **Every animation should mean something** — communicate a spatial relationship or a state change, not decorate. Direction encodes hierarchy: forward moves inward, back moves outward.
- **Honor `prefers-reduced-motion`.** Under it, route transitions collapse to a cut (already handled in `theme.css`) and in-page motion drops to opacity or nothing. Never ship an animation that only has a full-motion path.

## 10. Drag & drop (`@dnd-kit`) — the four causes of drop flicker

Every flicker we have shipped in a drag came from one of these. Check all four before adding a new drag surface — [`decks/ui/deck-tree.tsx`](../src/decks/ui/deck-tree.tsx) and [`decks/pages/use-deck-library.tsx`](../src/decks/pages/use-deck-library.tsx) are the worked examples.

- **The dropped state must be true on screen the instant the finger lifts.** Our writes round-trip through RxDB, and a reorder is _one write per row_, so the store re-emits half-applied states on the way. Render those and the dropped row snaps back, then jumps. Hold the drop over the store's emissions until the persisted rows agree with it — [`useOptimisticPatch`](../src/shared/lib/use-optimistic-patch.ts) does this for entities (it covers `order` **and** a reparent's `parentId`/`folderId`; a reparent left un-held flicks the row back to its old group for a frame). A local surface with no entity store does the same thing with a working copy synced from props (the settings select/swipe editors).
- **Render the list in a deterministic order, not the store's.** RxDB returns rows by primary key, so a list that doesn't sort by `order` will _silently ignore_ the reorder it just persisted and snap back. Sibling groups go through `siblingDecks()`; folders through their `order`.
- **The card in hand must be the row it came from.** A `DragOverlay` whose child has a different size, padding, or missing control (a select checkbox, a fixed `w-24` where the real tile is `flex-1`) morphs into the real row on drop, which reads as a flicker. Share the row's frame and body between the live row and the overlay (`DeckDragPreview`, `FolderDragPreview`, `Tile`), and carry the lift with **shadow, not `scale`** — a scaled overlay pops at the end of the drop animation.
- **Nothing may animate `opacity` on the landing row while the overlay is still flying to it.** dnd-kit hides the drop source with an inline `opacity: 0` for the duration of the drop animation, but a reparented row _unmounts and remounts_ in its new group, and a `motion` mount-entrance will overwrite that inline style — the row fades up underneath the card still in flight and you see the same deck twice. Suppress entrance animations while a drag is active **and** for the length of the drop animation after it (`quiet`/`settling` in `DeckTree`).

Two rules that are design, not bugs, and that the above depends on:

- **Don't let the sortable shift rows in a tree.** Sortable's "rows make room" animation is a promise that the drop is a _reorder_; in a tree half of them are a _nest_, so it lies before the user even releases. Use a no-op `SortingStrategy` and say what the drop will do explicitly: a `DropIndicator` line in the seam for a reorder, a ring on the row for a nest.
- **Read the drop intent from the pointer, not from the drag delta or rect centres.** [`dropZone()`](../src/shared/domain/drop-zone.ts) splits the hovered row into edges (reorder) and a middle band (nest). Pair it with `pointerWithin` collision so the zone is measured against the row the finger is actually inside, and track the pointer from real events — a delta-derived pointer drifts away from the finger as soon as the list auto-scrolls.
