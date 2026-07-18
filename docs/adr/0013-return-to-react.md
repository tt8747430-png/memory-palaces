# ADR-0013: Return to React 19 + Vite; the Angular migration is abandoned

**Status:** Accepted
**Date:** 2026-07-16 (recorded 2026-07-18)
**Supersedes:** ADR-0001, ADR-0002, ADR-0003, ADR-0005, ADR-0006, ADR-0007, ADR-0009 — all deleted,
since they decided the shape of an Angular app that no longer exists.
**Amends:** ADR-0004 and ADR-0008, whose decisions survived and were re-expressed in React terms.

## Context

ADR-0003 committed to an in-place Angular migration on the `angular-migration` branch: the repo root
became an Angular app, the React tree moved to `legacy-react/` as a frozen reference, and files were
ported one at a time. ADRs 0001–0009 built out that world — Material + PrimeNG widget ownership, the
M3/PrimeNG theme bridge, ngsw, Transloco, the Angular CLI Vitest builder.

The migration reached a working Angular app. It was still abandoned, because the cost landed
somewhere the plan had not priced in: **the View layer had to be rebuilt from nothing anyway, and the
Angular ecosystem made the rebuild worse, not better.**

- **The widget ownership matrix never settled.** ADR-0002 assigned each category to exactly one
  library, then ADR-0007 pulled bottom navigation back out (Taiga removed, hand-rolled to M3), and
  ADR-0009 pulled sheets and dialogs out too (Material → PrimeNG headless). Three ADRs in, the app
  was supplying its own chrome for every overlay and the nav, and the libraries contributed mechanics
  we then fought through two theme systems (ADR-0001) to restyle.
- **The mobile surfaces are the product, and they were the hardest part.** Swipeable rows, the drag
  tree, gesture-driven drawers, keyboard-aware overlays — no Angular library ships these, so they
  were hand-built regardless. Meanwhile Base UI/shadcn give the same primitives headless and
  unstyled, which is what the app actually wanted from a library.
- **The port was open-ended.** Parity was defined as "`legacy-react/` is empty" (ADR-0006). The
  remaining distance was large, and every ported file spent effort translating idioms rather than
  improving the product.

The decisive fact: **the core was never the problem.** ADR-0004's layering had made the domain,
commands, and stores framework-agnostic — pure TS with no framework import. Roughly **7,600 lines**
(domain algorithms, entity models, CQRS-lite commands, repository ports and adapters, RxDB schemas)
could cross back to React untouched. The migration cost was concentrated entirely in the View layer,
which was being rewritten either way.

## Decision

**Revert to React 19 + Vite.** Keep the architecture; replace the framework.

1. **The framework-agnostic core is preserved verbatim** — `shared/domain/`, each area's `model/`,
   `commands/`, the `Repository<T>` port and its adapters, the RxDB schemas, and their colocated
   tests. This is the whole reason the revert is affordable.
2. **Angular reactivity is replaced by one primitive, not a library.** `Observable<T>`
   (`shared/data/observable.ts`) is deliberately **callable** — `store.decks()` reads like the signal
   it replaces — so the core's ~7,600 lines of selector reads did not change. React binds to it in
   exactly one place, `useStore()` (`shared/data/use-store.ts`), a `useSyncExternalStore` seam. No
   Zustand, no Redux: the stores already existed and are framework-agnostic.
3. **Angular DI is replaced by the composition root plus one context.** `composition-root.ts` builds
   every store over its adapter; `ServicesProvider` (`shell/services-provider.tsx`) publishes them;
   `useServices()` is the DI seam. The `createServices()` / `createTestServices()` swap survives
   intact.
4. **ViewModels become hooks** (ADR-0008 as amended). The boundary and the no-middle-man rule are
   unchanged.
5. **The UI stack is headless-first**, which is what the widget-matrix churn was groping toward:
   shadcn/ui components over `@base-ui/react` primitives, `lucide-react` icons, `sonner` toasts,
   `@dnd-kit` for drag, `motion` for gestures, and the View Transitions API for route boundaries
   (ADR-0012). Swipe rows and the bottom nav stay custom — unchanged from the Angular era, because no
   library ships them in either ecosystem.
6. **Platform choices revert with the framework:** `vite-plugin-pwa` + Workbox replaces ngsw;
   `i18next` + `react-i18next` replaces Transloco (runtime language switching, the requirement that
   picked Transloco, is native to i18next); Vitest runs directly rather than through a CLI builder.
7. **RxDB stays**, unchanged, including the database name and collection schemas.

The branch keeps the name `angular-migration`. Renaming it would cost more history than the name is
worth; this ADR is the record of what it actually contains.

## Consequences

- **ADRs 0001–0003, 0005–0007, 0009 are deleted, not marked superseded.** They describe library and
  platform choices for an app that no longer exists in any branch's future; leaving them in the log
  reads as current guidance, and an agent following ADR-0002 would reach for PrimeNG today. Their
  content remains in git history. The gaps in the ADR numbering are intentional and explained here.
- **ADR-0004 and ADR-0008 keep their numbers** — code comments cite ADR-0008 directly — and carry an
  `Amended` line pointing back here.
- **ADRs 0010–0012 were written for the React rebuild already** and need no revision.
- The `Observable` primitive is app-owned infrastructure. That is the deliberate price of the core's
  framework independence, and it is ~60 lines with its own tests.
- **The lesson worth keeping:** the layering in ADR-0004 was adopted as design discipline, not as
  portability insurance, and it is what made a framework reversal cost the View layer only. Keep the
  domain, commands, and stores free of framework imports — the boundary rule in `eslint.config.js`
  is what enforces it.
