# Code Style

Conventions for writing components in Mindscape. These build on the architecture in [CLAUDE.md](../CLAUDE.md) (FSD layers, entity stores, feature commands) — read that first. Each rule below points at a real file in the repo that already does it right; match that shape.

The goal: small, single-responsibility, reusable pieces. When AI (or a human) drops 500 lines into one component, decompose it using the rules here rather than leaving it.

Mobile-specific and PWA behavior guidelines (touch targets, thumb zone, gestures, safe areas, offline-first, install/update) live in a separate doc: [MOBILE_DESIGN.md](MOBILE_DESIGN.md).

---

## 1. Compose small components; don't build monoliths

Split a screen into single-responsibility parts: a container that wires data, then presentational children (section → list → item). One job per component.

**Where each piece lives (FSD placement):**

| Reusable across the app, purely presentational | `shared/ui/` (e.g. `Sheet`, `GlassCard`, `Button`) |
| Composite UI tied to one domain/screen area    | `widgets/<x>/ui/` |
| Screen root                                     | `pages/<x>/ui/` |
| A subpart used only by one parent               | next to that parent in the same `ui/` folder |

**Good example — [`widgets/study-session/ui/`](../src/widgets/study-session/ui/):** the widget is split into `StudyDeck`, `CompletionOverlay`, `GearSheet`, `ModeSheet`, `QuickActionRows`, `ToggleRow`, `SheetSection`, `card-faces` — each focused, composed by the panel, with shared types in `model/` and a public `index.ts` barrel.

**Rules of thumb:**

- Soft budget ~200 lines per component file. When a file passes that, extract children. Current worst offenders to decompose when you touch them: `widgets/study-session/ui/card-faces.tsx` (~1000 lines), `pages/deck-library/ui/DeckLibraryPage.tsx`, `widgets/content-editor/ui/DeckContentEditor.tsx`.
- A page composes widgets and `shared/ui`; it should not hold much presentational markup itself.
- Extract a component to `shared/ui` **only when it's genuinely app-wide and presentational** — don't hoist a one-off. A subpart reused within a single widget/page stays local.

## 2. Extract logic into hooks; keep components rendering

Stateful/effectful logic (subscriptions, gestures, timers, DOM measurement) belongs in a hook, not inline in JSX. The component reads the hook's result and renders.

- **Reusable** hooks live in `shared/lib`: [`use-long-press`](../src/shared/lib/use-long-press.ts), [`sticky-header/use-sticky-header`](../src/shared/lib/sticky-header/use-sticky-header.ts), `use-sortable-sensors`, `gestures`, `haptics`. One-off hooks colocate with their component.
- **Pure domain logic never goes in a component or hook** — it lives in `shared/lib` (`srs`, `streak`, `stats`, `deck-tree`, `order`, `naming`) or `entities/*/model`, where it is unit-tested independently of React.

## 3. Complex local state → reducer / state machine, not a pile of `useState`

When several pieces of state change together or a feature has distinct phases, model it as a reducer or a discriminated-union state machine instead of many `useState` calls.

- Keep the machine **pure and outside the component**, in the feature/model layer: [`features/review/session-machine.ts`](../src/features/review/session-machine.ts), [`features/quiz/quiz-machine.ts`](../src/features/quiz/quiz-machine.ts) (each with its own `*.test.ts`). The component just dispatches.
- `useReducer` is the right call for multi-field, interdependent UI state — see [`widgets/quiz/ui/QuizSession.tsx`](../src/widgets/quiz/ui/QuizSession.tsx), `widgets/match/ui/MatchBoard.tsx`, `widgets/study-session/ui/FlashcardsPanel.tsx`.
- A lone toggle or a single value is still fine as `useState` — don't over-engineer.

## 4. Composition over configuration

From the `vercel-composition-patterns` skill. Build flexible components by composing, not by piling on boolean props.

- **Avoid boolean-prop proliferation.** When a component sprouts `isPrimary`, `isCompact`, `hasIcon`, `showHeader`… it's doing too many jobs. Split into explicit variant components, or expose slots via `children`, instead of branching on flags internally.
- **Variant styling via lookup maps of complete static strings.** See [`shared/ui/button.tsx`](../src/shared/ui/button.tsx): `variantStyles` / `sizeStyles` are `Record<Variant, string>` maps. Never assemble a class from `` `bg-${x}` `` — the Tailwind compiler can't see it (§5).
- **Compound components for multi-part UI.** For a component with coordinated parts (a sheet with header/body/actions, a segmented control), expose subcomponents that share state through context rather than a wide flat prop list — see `shared/ui/Sheet`, `ActionSheet`, `SegmentedControl`. The provider owns the state; children read it. This is the same provider-owns-state shape the entity stores already use (`entities/*/model/context.ts`).
- **Prefer `children` over `renderX` props.** Pass composition through `children`/slots, not `renderHeader`/`renderItem` callbacks — reserve render props for when the parent must inject per-item data.
- **Polymorphism for element changes.** When the same UI must render different elements (`<button>` vs `<a>` vs a router `Link`), add an `as` prop to one component rather than shipping `Button` + `LinkButton` + `IconButton`.
- **React 19 conventions:** `ref` is a normal prop — **don't use `forwardRef`** (the repo has zero; keep it that way). Prefer `use(Context)` over `useContext(Context)` in new code (existing `context.ts` files use `useContext` — fine to leave, migrate opportunistically).

## 5. Tailwind

This repo is Tailwind **v4** with a two-layer token system: primitives (`--p-navy-900`, …) → semantic roles (`--primary`, `--card`, `--border`, `--danger-surface`) in [`src/styles/tokens.css`](../src/styles/tokens.css), exposed to Tailwind via `@theme` in [`theme.css`](../src/styles/theme.css).

- **Compose classes with [`cn()`](../src/shared/lib/cn.ts)** (clsx + tailwind-merge), never template-literal concatenation — `cn()` resolves conflicting utilities deterministically; `` `p-4 ${cond && 'p-6'}` `` does not.
- **Never construct class names dynamically.** Use a lookup map of full static strings (like `button.tsx`), or an inline `style` for truly dynamic values (user-set color, computed position).
- **Use semantic tokens, not raw values.** `bg-primary`, `text-heading`, `bg-card`, `border-border`, `rounded-control`, `shadow-rest` — not `bg-[#091A7A]`, not `p-[16px]` where `p-4` exists. Reach for a CSS var (`var(--danger-surface)`) when there's no utility alias yet.
- **Dark mode is automatic via tokens.** Semantic tokens remap under `[data-theme='dark']` in `tokens.css`. Do **not** scatter `dark:` variants or hardcode light/dark colors in components — pick the semantic token and both themes follow.
- **Interactive elements need states.** hover / `focus-visible` / `disabled` + a `transition`, as in `button.tsx`'s `base` string. Icon-only buttons need an `sr-only` label; use `focus-visible:` (keyboard) over `focus:`.
- **Mobile-first & responsive.** Base styles target the smallest screen; layer `sm: → md: → lg:` upward. This is a portrait-first PWA — verify at phone width.

## 6. TypeScript & imports

Covered in [CLAUDE.md](../CLAUDE.md); the load-bearing ones: use `import type` for type-only imports (`verbatimModuleSyntax`), no `any` (use `unknown`), cross-slice imports go through the slice's `index.ts` barrel only, and use the `@/` alias — never deep relative paths across slices.

## 7. Performance (React core)

From the `vite-react-best-practices` skill (React-core rules), grounded in this repo. Ordered by impact.

- **Parallelize independent async — don't await in sequence.** Use `Promise.all` for independent reads/writes; this is already the norm in feature commands (`features/deck/delete-deck.ts`, `features/card/reorder-cards.ts`). Await sequentially only when one call truly depends on the previous.
- **Subscribe narrowly.** Entity stores expose selectors — read the smallest slice you need via `useXStore(selector)`, and prefer a **derived boolean** (`selectIsReady`) over a raw array when you only need readiness. Don't subscribe to state you only use inside a callback; read it from `useXStoreApi().getState()` at call time instead.
- **Memoize deliberately.** `useMemo` for expensive derivations is already common (~25 files) — keep it for real work, not trivial values. `React.memo` is currently unused; reach for it to wrap an expensive child when a hot parent (a list, a study session) re-renders frequently.
- **Split routes with `React.lazy` + `Suspense`.** `app/router.tsx` currently imports all ~30 page components eagerly — lazy-load them so each route is its own chunk (the `lazy()` + `Suspense` pattern already exists in `app/RootLayout.tsx`); Vite emits the split automatically. Do the same for heavy, rarely-opened widgets.
- **Barrels — the one deliberate exception to the "avoid barrel imports" rule.** FSD slice `index.ts` barrels are our required public API; **keep them.** The tree-shaking caveat applies to *third-party* barrels: import large libs by name (`import { X } from 'lucide-react'` — already done), and don't add re-export chains inside a slice that pull in unrelated heavy modules.
- **Reserve space for images (CLS).** Set explicit `width`/`height` or an `aspect-ratio` on `<img>` so late-loading images don't shift layout — applies to `shared/ui/Avatar` (the app's only `<img>`) and any palace/cover art added later.
- **Don't define components inside components.** A component declared in another's render body remounts every render (state loss + churn) — hoist it to module scope, or pass it via `children`.
- **Derive during render; don't mirror state with effects.** Compute values from props/state inline or with `useMemo`. Reserve `useEffect` for syncing with the outside world, and put interaction logic in event handlers, not effects.
- **Passive listeners for scroll/touch.** Register scroll/touch listeners with `{ passive: true }` so they don't block scrolling — matters on the gesture/swipe surfaces (`shared/lib/gestures`, `shared/ui/SwipeRow`).
- **Keep input responsive with concurrent features.** Wrap expensive, non-urgent updates (filtering/searching decks and cards) in `startTransition` or `useDeferredValue`.
- **Rendering hygiene:** conditional render with a ternary (`cond ? <X/> : null`), not `cond && <X/>` (a falsy `0`/`''` renders as stray text); hoist static JSX out of render; use CSS `content-visibility` or windowing for long deck/card lists.
- **JS micro-perf stays in `shared/lib`** where it's unit-tested: `Map`/`Set` for repeated lookups, `toSorted()` for immutable sorts, early-exit. Don't inline these into components.
- **Server state (future):** there's no backend yet — reads come from local RxDB. When a cloud/REST layer lands, route server state through a query library (React Query/SWR) for dedup + caching, not ad-hoc `useEffect` + `useState`.

## 8. Vite build & SPA deployment

From the `vite-react-best-practices` skill's Vite-SPA rules. This is a client-routed SPA (TanStack Router) shipped as a PWA — these are non-negotiable for a correct production deploy.

- **SPA fallback rewrite is mandatory — and currently missing.** With client-side routing, the host must rewrite unknown paths to `/index.html`, or refreshing/deep-linking a route like `/deck/123` returns a 404. Add the host's rewrite before deploying (`public/_redirects` → `/* /index.html 200` for Netlify, or `vercel.json` `rewrites` for Vercel). No such config exists in the repo yet.
- **Cache hashed assets immutably, never `index.html`.** Vite fingerprints `assets/*` filenames — serve those `Cache-Control: public, max-age=31536000, immutable`, but serve `index.html` `no-cache` so new deploys are picked up. (The `vite-plugin-pwa` Workbox precache already handles this at the SW layer; the CDN/host headers must agree.)
- **Validate the production build before pushing:** `npm run build && npm run preview`. `preview` serves the real built output — it catches base-path, lazy-chunk, and asset issues that `npm run dev` hides.
- **Env vars: `VITE_` prefix = public.** Only `import.meta.env.VITE_*` (and `DEV`/`PROD`/`MODE`) reach the client bundle; anything without the prefix is stripped. Never put a secret in a `VITE_` var — it ships to every user (see `import.meta.env.DEV` in `app/RootLayout.tsx`).
- **Never import from a dependency's `dist/`** — import the package entry so it's bundled once and tree-shaken; deep `dist` imports double-bundle and break dedup.

## 9. Animation

- **`motion` is the animation library** (used in ~58 files) — reach for it, don't hand-roll. Animate GPU-friendly properties (`transform`, `opacity`), not layout props (`width`, `height`, `top`, `margin`), which force reflow and drop frames.
- **Every animation should mean something** — communicate a spatial relationship or a state change, not decorate. Honor `prefers-reduced-motion`.
- **View Transitions API (`<ViewTransition>`) — optional/future, not adopted.** It gives native route and shared-element morphs, but needs `react@canary` (we ship stable React 19) and would overlap `motion`. If route/shared-element transitions are wanted, adopt it deliberately per the `vercel-react-view-transitions` skill (`default="none"`, type-keyed directional transitions) — don't run it alongside `motion` ad hoc.
