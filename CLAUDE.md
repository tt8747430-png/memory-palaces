# CLAUDE.md

Mindscape — an offline-first PWA for memory-palace / spaced-repetition study. **Angular 22 + TypeScript**, organized as **feature areas × Clean Architecture × MVVM**. RxDB is the on-device source of truth.

> **Migration in progress.** The app is being ported from React 19 + Vite to Angular (ADR-0003/0006). The frozen React reference lives in `legacy-react/` — it is **not linted, not built, and never imported**. It is deleted file-by-file as each port is verified; `.scratch/angular-migration/port-tracker.md` is the ledger. When porting, read the React original first — behaviour parity is the bar.

## Skills — consult before writing code

Installed skills carry detailed, version-aware guidance — apply the relevant one instead of working from memory:

- **`angular-developer`** — signals, `linkedSignal`, `resource`, forms, DI, routing, a11y, testing, CLI.
- **`vercel-composition-patterns`** — component API design (compound components, avoid boolean-prop proliferation) → [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §4. The React-specific parts don't apply; the composition principles do.
- **Not applicable — this is an Angular web PWA:** `vite-react-best-practices`, `vercel-react-best-practices`, `vercel-react-view-transitions`, `react-native-best-practices`, and the RN/Flutter parts of `mobile-design`.

**Before building anything non-trivial, stress-test the plan/design** with a grilling skill (suggest it; the user runs it):

- **`/grill-me`** — a relentless interview to sharpen a plan or design before writing code.
- **`/grill-with-docs`** — same, but captures decisions as ADRs and updates [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md).
- **`grilling`** — the auto-invocable variant.

More generally: when a task matches an installed skill (deploy, testing, debugging, design/UX review…), invoke it rather than guessing.

## How to approach each kind of change

Build elegant, high-performance, deeply intuitive solutions. Two principles govern every change:

- **Zero legacy — no backwards compatibility in _code_.** Target modern runtimes and the latest stable versions of our deps (Angular 22, Tailwind v4). No polyfills, no fallback branches, no deprecated APIs, no dead compatibility shims. **The one exception is persisted data:** RxDB schemas and anything already on a user's device need real backwards compatibility — evolve them with RxDB schema migrations, never a silent breaking change that orphans stored decks/cards/reviews.
- **Optimal over overengineered.** Prefer the simplest execution that scales. Clean, readable, maintainable beats clever. Avoid premature abstraction, deep nesting, and unnecessary third-party deps. A lone toggle stays a `signal()`; reach for a machine only when state actually earns it ([`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §3).

Then apply the rule for the kind of work:

- **Refactoring — ruthless, but behavior-preserving.** Rip out legacy patterns and outdated infrastructure; adapt everything to the current architecture. Decompose monoliths into single-responsibility pieces rather than leaving 500-line components. Constraints: keep tests green, don't silently widen scope, don't touch persisted schemas without a migration. Confirm before large deletions you didn't author.
- **Writing new code — match the area shape, don't invent one.** Place code by feature area; copy the shape of the nearest existing one. **Writes** go through a command, **reads** through store signals, **pure logic** into `shared/domain` or an area's `model/` with colocated tests. Cross-area imports only through barrels.
- **Design quality — make it feel premium and intentional.** Every surface handles all its states — loading, error, empty, **and offline** — not just the happy path. Micro-interactions, spacing, and motion communicate state, never decorate; honor `prefers-reduced-motion` and safe areas. Semantic tokens only (no raw hex, no per-component `dark:`). Follow [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §5 & §9 and [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md).
- **Completeness — ship fully realized code.** No placeholders, no truncated `// ...`, no "implement later" stubs unless explicitly requested. Wire the whole path end-to-end: command + store, i18n keys in `public/i18n/en.json`, barrel exports, and the states above. Then verify — `npm run typecheck && npm run lint && npm run test` — before claiming it's done.

## Commands

- `npm start` / `npm run dev` — `ng serve`
- `npm run build` — `ng build` (production; also the real check that global styles/assets resolve)
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json`
- `npm run lint` — `ng lint`
- `npm run test` — `ng test` (Vitest via `@angular/build:unit-test`)
- **Running one spec:** `npx vitest` **does not resolve the `@app/*` path alias** — it only works through the Angular builder. Use `npm run test` and read the filtered output.
- **Formatting:** `npm run format` runs Prettier over the whole repo — instead format only files you touched: `npx prettier --write <files>`.

## Architecture — feature areas (ADR-0004)

FSD is gone. Code is organized by feature area, Angular-style:

```text
src/app/
  decks/  study/  practice/  auth/  settings/  notifications/  import/
    model/     ← entity types + factories/invariants. Pure TS, no Angular, no IO.
    data/      ← signal stores + repository InjectionTokens (+ RxDB schemas)
    commands/  ← one use-case per file (CQRS-lite). All writes.
    pages/     ← routed standalone components (+ their view models)
    ui/        ← components owned by the area
  shared/
    domain/    ← pure algorithms, all unit-tested (srs, streak, stats, deck-tree, order…)
    data/      ← Repository<T> port, RxDB + in-memory adapters, store base classes
    ui/        ← the design system
    config/    ← routes, constants
  shell/       ← app chrome: nav, splash, theme, update prompt, bridges
  data.providers.ts  ← composition root
  app.routes.ts      ← lazy routes per area
```

**The one boundary rule: `shared/` must never import from a feature area.** Path alias `@app/*` → `src/app/*`.

### Clean Architecture, as it actually exists

- **Domain core** — `shared/domain/` + each area's `model/`. Framework-agnostic, no IO. Factories `makeX()` / `updateX()` trim, validate, and **throw on invariant violations**.
- **Ports** — `Repository<T>` (`shared/data/base-repository.ts`), bound via `InjectionToken`s.
- **Adapters** — `shared/data/rxdb-repository.ts` (production, Dexie/IndexedDB), `shared/data/in-memory-repository.ts` (tests).
- **Composition root** — `data.providers.ts` builds the RxDB database and binds one repository per entity into its token. Tests swap the in-memory adapter in at the same seam.
- **Dependency rule:** the core depends on ports, never on RxDB.

### Stores

One signal store per entity, `providedIn: 'root'`, extending `CollectionStore<T>` or `SingletonDocStore<T>` (`shared/data/`). `start()` subscribes to the repository's live RxDB query and mirrors it into signals; `save()`/`remove()` delegate to the repo. Selectors are `computed()` on the store.

**Never call `start()` from a component.** Every reactive store is started once at the composition root (`data.providers.ts`). Unit tests arrange it themselves.

### Commands = all writes (CQRS-lite)

`<area>/commands/` holds **one use-case per file** — plain async functions taking the store plus input: `createDeck(store, input)`. Components/VMs `inject()` a store and pass it in. To add a mutation, add a file and export it from the area's command index.

Bulk actions are **their own commands** (`setDecksArchived(store, ids, archived)`), not a loop at the caller. Domain rules live in the command, not in the caller that invokes it.

## MVVM (ADR-0008) — read this before touching a page

- **View** = the component. It owns the template, and presentation that never leaves it (icon sets, scroll-driven elevation). Nothing else.
- **ViewModel** = an `@Injectable()` class listed in the component's own `providers: [XVm]`, injected with `inject(XVm)`. It owns view state, derived read models (`computed`), and orchestration (command dispatch, toasts/undo, confirms, navigation intents).
- **Model** = stores + commands + domain.

Navigation is exposed as VM intents (`openProfile()`, `openDeck(id)`) — templates never carry route strings.

### The no-middle-man rule

> **Extract a ViewModel only when a page owns real derived state or multi-step orchestration. A class that merely forwards to stores and commands is a Middle Man — delete it and let the component read the store directly.**

VMs are **earned, not automatic**. Most pages stay plain components; that asymmetry is intentional. The same rule governs everything else:

- **Never write a pass-through wrapper service.** A `MoveDeckSheetService` that only forwards to `MatBottomSheet.open()` is a Middle Man. The VM injects **real** services — `ToastService`, `ConfirmDialog`, `PromptSheet`, `ActionSheet` — which do real work.
- **A sheet that returns data exposes its own promise-returning `open*()` function, co-located in the sheet's file** (see `openMoveDeckSheet`, `openFolderSheet`). That's the component's public API, not a new layer — and it keeps the VM from naming a View component.
- **Don't add a command that only forwards to another.** "Unfile" is `moveDecks(store, ids, null, null)`, not an `unfileDecks`.
- **Barrels export only what other areas consume**, never an area's whole internals.

## UI, routing, i18n, PWA

- **Widget ownership is fixed by ADR-0002** — each category has exactly one owner; never two implementations of the same category. Material owns sheets/dialogs/form-fields/buttons; PrimeNG owns menus/toasts/tree/progress; icons are `lucide-angular`. Swipeable rows and the bottom nav **stay custom** — no library ships them (ADR-0007).
- **Styling (ADR-0001):** components come from their owning library and are styled **only** through its theme system (Material M3 `--mat-sys-*`, PrimeNG tokens), both fed by the app's semantic tokens in `src/styles/tokens.css`. **Layout and spacing come from Tailwind utilities in templates — nothing else.** Component-scoped CSS only for what neither expresses. Dark mode is one attribute (`data-theme`) — never per-component `dark:`, never raw hex.
- **Routing:** TanStack Router is gone — routes are declared in `app.routes.ts`, lazy per area, gated by `auth.guard.ts`. Unported destinations wildcard-redirect home.
- **i18n:** Transloco. Keys live in `public/i18n/en.json`.
- **PWA:** `@angular/service-worker` (`ngsw-config.json`); `shell/update-prompt.ts` surfaces updates.

## Conventions

- **Read [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) before writing UI** — small single-responsibility components, complex state as machines, composition over boolean props, semantic tokens only, narrow store reads, `Promise.all` for independent async.
- **Touching drag-and-drop? Read [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §10 first.** It names the four causes of drop flicker we have actually shipped, plus the design rules the fixes depend on.
- **Mobile & PWA rules: [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md)** — 430px column, touch targets/thumb-zone, gestures + haptics, sheets/overlays, animation feel, safe areas, offline-first, install/SW-update caveats.
- **Domain vocabulary: [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md)** — use the canonical terms (Deck, Card, Question, Review, Study session, Learner…) in code, UI copy, and commits. It flags overloaded terms: "session" = auth (Guest/Account), never a study pass; `known` (SRS status) ≠ Memorized (manual flag); no "palace/room/locus" — we ship Deck/Card/Question.
- **Selectors:** components `ms-` (element, kebab-case), directives `ms` (attribute, camelCase) — lint-enforced.
- Strict TS with `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax` + `isolatedModules` → use `import type` for type-only imports. `strictTemplates` is on.
- Tests are colocated as `*.spec.ts`; Vitest + jsdom, **`globals: false`** (import `describe/it/expect` from `vitest`), `fake-indexeddb`, setup in `src/test-setup.ts`. Prefer testing a VM or command over rendering a component.
- Prettier: no semicolons, single quotes, trailing-comma `all`, printWidth 100.

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
