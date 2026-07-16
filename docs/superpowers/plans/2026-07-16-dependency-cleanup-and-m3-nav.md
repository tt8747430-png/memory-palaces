# Dependency Cleanup and M3 Bottom Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove 22 unused/single-use npm packages (36+ MB) and rebuild the bottom navigation by hand to the Material 3 navigation bar spec.

**Architecture:** `@taiga-ui` (12 packages) exists solely to supply `TuiTabBar` for the bottom nav; `@maskito` (4) and `@ng-web-apis` (6) have zero imports. The nav is rebuilt as a standalone component using semantic markup + `routerLinkActive` + lucide icons + Tailwind utilities, themed through the `--mat-sys-*` M3 roles the app already bridges to its `--sw-*` semantic tokens. No replacement library: Angular Material v22 ships no navigation bar, Material Web's is labs-only, PrimeNG has no equivalent.

**Tech Stack:** Angular 22, Angular Material 22 (M3 `mat.theme()`), Tailwind v4, lucide-angular, Transloco, Vitest.

**Source spec:** `docs/superpowers/specs/2026-07-16-angular-mvvm-and-dependency-cleanup-design.md` (Part 1)

## Global Constraints

- **Zero legacy.** No polyfills, no compatibility shims, no deprecated APIs.
- **Semantic tokens only.** No raw hex. No per-component `dark:` — dark mode flips via `data-theme` on `<html>` and the token layer.
- **ADR-0001 styling discipline:** components from libraries; **layout and spacing from Tailwind utilities in templates**. Component-scoped CSS only for what neither expresses.
- **Selector prefix:** components `ms-` (kebab-case), directives `ms` (camelCase) — enforced by `angular-eslint`.
- **Prettier:** no semicolons, single quotes, trailing-comma `all`, printWidth 100.
- **TypeScript:** strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` → use `import type` for type-only imports.
- **Touch targets ≥ 44px** per `docs/MOBILE_DESIGN.md`.
- **Tests:** Vitest with `globals: false` — import `describe`/`it`/`expect` from `vitest`. Specs colocated as `*.spec.ts`.
- **Formatting:** never run `npm run format` (reformats the whole repo). Use `npx prettier --write <files>` on touched files only.
- **M3 navigation bar spec (verbatim, from Material Web's reference token values):**
  - Container: height `80px`, color role `surface-container`
  - Active indicator: `64px` wide × `32px` high, shape `corner-full`, color role `secondary-container`
  - Icon: `24px`; active color role `on-secondary-container`, inactive `on-surface-variant`
  - Label: `label-medium` (12px / 16px line-height / weight 500); active color role `on-surface`, inactive `on-surface-variant`
- **Destination count:** stays at 2 (Home, Profile). This is a recorded deviation from M3's 3–5 guidance — do not add destinations.

---

## Task 0: Resolve the staged working tree (BLOCKER — human decision)

**Files:** none (git only)

The index currently holds **22 staged files** of settings-area port work from a previous session. Any commit made by this plan would sweep them in.

- [ ] **Step 1: Confirm the staged set with the owner**

```bash
git diff --cached --name-only
```

Expected: 22 files (`app.routes.ts`, `settings/pages/*`, `shared/ui/swipe-*`, `shared/ui/select-*`, …).

- [ ] **Step 2: STOP. Ask the owner which they want**

Do not proceed until answered. Options: (a) commit the port work on its own first, (b) leave it staged and scope every commit in this plan with explicit pathspecs, (c) unstage it.

**Do not `git add -A` or `git commit -a` anywhere in this plan.** Every commit uses explicit paths.

---

## Task 1: Remove the provably-dead dependencies

`@maskito/*` and `@ng-web-apis/*` have **zero references** in `src/` and configs. Verified via grep across `.ts`, `.html`, `.css`, and JSON.

**Files:**

- Modify: `package.json` (dependencies)

**Interfaces:**

- Consumes: nothing
- Produces: nothing — pure removal

- [ ] **Step 1: Prove they are unreferenced (do not skip — this is the safety gate)**

```bash
grep -rn "maskito\|ng-web-apis" src angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json
```

Expected: **no output** (exit 1). If anything matches, STOP and report — the premise is wrong.

- [ ] **Step 2: Remove the packages**

```bash
npm uninstall @maskito/angular @maskito/core @maskito/kit @maskito/phone \
  @ng-web-apis/common @ng-web-apis/intersection-observer @ng-web-apis/mutation-observer \
  @ng-web-apis/platform @ng-web-apis/resize-observer @ng-web-apis/screen-orientation
```

- [ ] **Step 3: Verify the build still typechecks and tests pass**

```bash
npm run typecheck && npm run test
```

Expected: PASS. Nothing referenced these, so nothing can break.

---

## Task 2: Pin the M3 `secondary-container` roles to app tokens

The M3 active indicator uses the `secondary-container` / `on-secondary-container` roles. `styles.scss` pins many `--mat-sys-*` roles but **not these two**, so they fall through to `mat.$azure-palette`'s generated long tail — off the `--sw-*` palette.

**Files:**

- Modify: `src/styles.scss:34-63` (the Material system-variable bridge)

**Interfaces:**

- Produces: `--mat-sys-secondary-container` and `--mat-sys-on-secondary-container` resolve to app tokens. Task 3's nav consumes both.

- [ ] **Step 1: Confirm the roles are currently unpinned**

```bash
grep -n "secondary-container" src/styles.scss
```

Expected: **no output**. If they are already pinned, skip this task.

- [ ] **Step 2: Confirm the token names exist before referencing them**

```bash
grep -n "^\s*--surface-sky:\|^\s*--primary:" src/styles/tokens.css
```

Expected: both are defined. These are the tokens the pin below references.

- [ ] **Step 3: Add the pins**

In `src/styles.scss`, inside the `html { ... }` block that starts at the comment `// ── Material system variables → semantic tokens`, immediately after the `--mat-sys-on-secondary` line, add:

```scss
// The M3 navigation bar's active indicator reads secondary-container; pin it to
// the app palette so it never falls through to the generated azure long tail.
--mat-sys-secondary-container: var(--surface-sky);
--mat-sys-on-secondary-container: var(--primary);
```

- [ ] **Step 4: Verify the build compiles the stylesheet**

```bash
npm run build
```

Expected: PASS. (`ng build` compiles SCSS; a bad var reference surfaces here.)

- [ ] **Step 5: Format**

```bash
npx prettier --write src/styles.scss
```

---

## Task 3: Rebuild `app-nav` to the M3 navigation bar spec

**Files:**

- Modify: `src/app/shell/app-nav.ts` (full rewrite of template + styles; `visible()` logic preserved)
- Create: `src/app/shell/app-nav.spec.ts`

**Interfaces:**

- Consumes: `ROUTES.home`, `ROUTES.profile` (`@app/shared/config/routes`); `--mat-sys-*` roles from Task 2; i18n keys `nav.label`, `nav.home`, `nav.profile` (already present in `public/i18n/en.json`).
- Produces: `AppNav` — selector `ms-app-nav`, no inputs, no outputs. `app.ts` already imports it; that import is unchanged.

**Design notes for the implementer:**

- Every M3 dimension maps to a stock Tailwind utility, so **no component CSS is needed for layout** (ADR-0001): `h-20` = 80px, `w-16` = 64px, `h-8` = 32px, `size-6` = 24px, `rounded-full` = corner-full, `text-xs font-medium leading-4` = label-medium.
- Colors use Tailwind v4's CSS-var syntax against the M3 roles: `bg-(--mat-sys-surface-container)`, `bg-(--mat-sys-secondary-container)`, `text-(--mat-sys-on-secondary-container)`, `text-(--mat-sys-on-surface-variant)`, `text-(--mat-sys-on-surface)`.
- The only thing Tailwind cannot express is `position: fixed` combined with the `--ms-z-nav` token and the safe-area inset, which the current file already handles in a small `styles` block. Keep that block.
- `routerLinkActive` supplies the active class; `ariaCurrentWhenActive="page"` supplies `aria-current`.
- The M3 item anatomy is **indicator-wraps-icon, label below** — the pill is 64×32 around the icon only, not the whole item.

- [ ] **Step 1: Write the failing spec**

Create `src/app/shell/app-nav.spec.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router, provideRouter } from '@angular/router'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { AppNav } from './app-nav'

@Component({ template: '' })
class Blank {}

describe('AppNav', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppNav,
        TranslocoTestingModule.forRoot({
          langs: { en: { nav: { label: 'Primary', home: 'Home', profile: 'Profile' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'profile', component: Blank },
          { path: 'decks/:deckId', component: Blank },
        ]),
      ],
    }).compileComponents()
  })

  const renderAt = async (url: string) => {
    await TestBed.inject(Router).navigateByUrl(url)
    const fixture = TestBed.createComponent(AppNav)
    await fixture.whenStable()
    fixture.detectChanges()
    return fixture.nativeElement as HTMLElement
  }

  it('renders both destinations on a tab route', async () => {
    const el = await renderAt('/')
    const links = el.querySelectorAll('a')
    expect(links.length).toBe(2)
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Primary')
  })

  it('marks the current destination with aria-current', async () => {
    const el = await renderAt('/')
    const current = el.querySelectorAll('a[aria-current="page"]')
    expect(current.length).toBe(1)
    expect(current[0]?.getAttribute('href')).toBe('/')
  })

  it('marks profile current when on profile', async () => {
    const el = await renderAt('/profile')
    const current = el.querySelector('a[aria-current="page"]')
    expect(current?.getAttribute('href')).toBe('/profile')
  })

  it('hides entirely on a non-tab route', async () => {
    const el = await renderAt('/decks/abc')
    expect(el.querySelector('nav')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the spec to verify it fails**

```bash
npx vitest run src/app/shell/app-nav.spec.ts
```

Expected: FAIL. The current component renders `tuiTabBarItem` anchors without `aria-current`, so the `aria-current` assertions fail. (The first and last tests may already pass — that is fine and expected.)

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/app/shell/app-nav.ts` with:

```ts
import { Component, computed, inject } from '@angular/core'
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, map } from 'rxjs'
import { House, LucideAngularModule, User } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'

interface NavTab {
  readonly path: string
  readonly icon: unknown
  readonly labelKey: string
  readonly exact: boolean
}

const TABS: readonly NavTab[] = [
  { path: ROUTES.home, icon: House, labelKey: 'nav.home', exact: true },
  { path: ROUTES.profile, icon: User, labelKey: 'nav.profile', exact: false },
]

const TAB_PATHS: readonly string[] = TABS.map((tab) => tab.path)

/**
 * Bottom navigation — shown only on the top-level tab destinations.
 *
 * Hand-rolled to the Material 3 navigation bar spec (ADR-0007): 80px container,
 * a 64x32 corner-full active indicator around the icon, label-medium beneath.
 * No library ships this widget; the M3 colour roles are the ones styles.scss
 * already bridges to the app's semantic tokens, so dark mode flips for free.
 */
@Component({
  selector: 'ms-app-nav',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, TranslocoPipe],
  template: `
    @if (visible()) {
      <nav
        class="ms-nav pb-safe flex bg-(--mat-sys-surface-container)"
        [attr.aria-label]="'nav.label' | transloco"
      >
        @for (tab of tabs; track tab.path) {
          <a
            class="group flex h-20 flex-1 flex-col items-center justify-center gap-1 no-underline"
            [routerLink]="tab.path"
            routerLinkActive="is-active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: tab.exact }"
          >
            <span
              class="grid h-8 w-16 place-items-center rounded-full text-(--mat-sys-on-surface-variant)
                     transition-colors duration-200 group-[.is-active]:bg-(--mat-sys-secondary-container)
                     group-[.is-active]:text-(--mat-sys-on-secondary-container)"
            >
              <lucide-icon [img]="tab.icon" class="size-6" />
            </span>
            <span
              class="text-xs leading-4 font-medium text-(--mat-sys-on-surface-variant)
                     group-[.is-active]:text-(--mat-sys-on-surface)"
            >
              {{ tab.labelKey | transloco }}
            </span>
          </a>
        }
      </nav>
    }
  `,
  styles: `
    /* Fixed placement + the app's z-index token: not expressible as utilities. */
    .ms-nav {
      position: fixed;
      inset-inline: 0;
      bottom: 0;
      z-index: var(--ms-z-nav);
    }
  `,
})
export class AppNav {
  private readonly router = inject(Router)

  protected readonly tabs = TABS

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  )

  protected readonly visible = computed(() => TAB_PATHS.includes(this.url()))
}
```

- [ ] **Step 4: Run the spec to verify it passes**

```bash
npx vitest run src/app/shell/app-nav.spec.ts
```

Expected: PASS (4 tests).

If `group-[.is-active]:` variants do not apply, the cause is Tailwind v4 arbitrary-variant syntax — verify by inspecting the rendered class list, and fall back to moving the three active-state rules into the existing `styles` block keyed off `.is-active` rather than fighting the utility syntax.

- [ ] **Step 5: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: PASS. `strictTemplates` is on — if `[img]="tab.icon"` errors on the `unknown` type, import `LucideIconData` from `lucide-angular` and type `NavTab.icon` as `LucideIconData`.

- [ ] **Step 6: Format**

```bash
npx prettier --write src/app/shell/app-nav.ts src/app/shell/app-nav.spec.ts
```

---

## Task 4: Remove Taiga UI entirely

With the nav no longer using `TuiTabBar`, the whole suite is dead. `TuiRoot` exists only to host Taiga components.

**Files:**

- Modify: `src/app/app.ts` (drop `TuiRoot` import + `imports` entry)
- Modify: `src/app/app.html` (drop the `<tui-root>` wrapper)
- Modify: `src/app/app.config.ts` (drop `provideTaiga()` + import)
- Modify: `src/app/app.spec.ts` (drop `provideTaiga`; fix the `tui-root` assertion)
- Modify: `src/styles.scss` (drop the `--tui-*` bridge; fix the header comment)
- Modify: `src/tailwind.css` (drop the `tui-root` rule)
- Modify: `angular.json` (drop the icons asset glob + the `.less` theme)
- Modify: `package.json` (drop 12 `@taiga-ui/*` + `less`)

**Interfaces:**

- Consumes: Task 3's `AppNav` (no longer imports `@taiga-ui/addon-mobile`)
- Produces: nothing — pure removal

- [ ] **Step 1: Confirm the nav is the only remaining Taiga consumer**

```bash
grep -rn "taiga\|Tui\b\|tui-root\|tuiTabBar" src --include='*.ts' --include='*.html' --include='*.css' --include='*.scss'
```

Expected: matches **only** in `app.ts`, `app.html`, `app.config.ts`, `app.spec.ts`, `styles.scss`, `tailwind.css`. If `app-nav.ts` still appears, Task 3 is incomplete — STOP.

- [ ] **Step 2: Unwrap `<tui-root>` in `src/app/app.html`**

Delete the opening `<tui-root>` line and the closing `</tui-root>` line, and outdent the contents by two spaces. `ms-root` is already `position: fixed; inset: 0`, so no replacement wrapper is needed. The first child stays the safe-area spacer div; the last stays the `key="update"` `<p-toast>`.

- [ ] **Step 3: Drop `TuiRoot` from `src/app/app.ts`**

Remove the line `import { TuiRoot } from '@taiga-ui/core'` and remove `TuiRoot` from the `imports` array, leaving:

```ts
  imports: [RouterOutlet, AppNav, Splash, Toast, MatButton, TranslocoPipe],
```

- [ ] **Step 4: Drop `provideTaiga()` from `src/app/app.config.ts`**

Remove the line `import { provideTaiga } from '@taiga-ui/core'` and the `provideTaiga(),` entry from the `providers` array.

- [ ] **Step 5: Fix `src/app/app.spec.ts`**

Remove `import { provideTaiga } from '@taiga-ui/core'` and the `provideTaiga(),` provider. Change the test name and assertion:

```ts
it('renders the router outlet and bottom navigation', async () => {
  const fixture = TestBed.createComponent(App)
  await fixture.whenStable()
  const compiled = fixture.nativeElement as HTMLElement
  expect(compiled.querySelector('router-outlet')).toBeTruthy()
  expect(compiled.querySelector('ms-app-nav')).toBeTruthy()
})
```

- [ ] **Step 6: Drop the `--tui-*` bridge from `src/styles.scss`**

Delete the whole block introduced by `// ── Taiga UI tokens → semantic tokens ───` (the `html { --tui-font-text: …; … --tui-border-normal: …; }` block, 11 declarations). Then fix the file's header comment, which currently reads "Angular Material M3, PrimeNG, and Taiga UI all read the app's semantic tokens" — drop the Taiga clause so it names Material and PrimeNG only.

- [ ] **Step 7: Drop the `tui-root` rule from `src/tailwind.css`**

Delete:

```css
tui-root {
  display: block;
  height: 100%;
}
```

- [ ] **Step 8: Clean `angular.json`**

In `projects.*.architect.build.options`: remove the assets entry

```json
{ "glob": "**/*", "input": "node_modules/@taiga-ui/icons/src", "output": "assets/taiga-ui/icons" }
```

leaving only the `public` entry. In `styles`, remove `"node_modules/@taiga-ui/styles/taiga-ui-theme.less"`, leaving `tokens.css`, `tailwind.css`, `styles.scss` in that order.

- [ ] **Step 9: Uninstall the packages**

```bash
npm uninstall @taiga-ui/addon-mobile @taiga-ui/cdk @taiga-ui/core @taiga-ui/design-tokens \
  @taiga-ui/event-plugins @taiga-ui/font-watcher @taiga-ui/i18n @taiga-ui/icons @taiga-ui/kit \
  @taiga-ui/layout @taiga-ui/polymorpheus @taiga-ui/styles && npm uninstall less
```

- [ ] **Step 10: Verify nothing references Taiga and everything passes**

```bash
grep -rn "taiga\|tui-root" src angular.json package.json; echo "--- grep exit: $? (1 = clean) ---"
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: grep exits 1 (no matches). All four commands PASS. `npm run build` is the real gate — it proves the removed `.less` theme and icon assets are gone cleanly.

- [ ] **Step 11: Format the touched files**

```bash
npx prettier --write src/app/app.ts src/app/app.html src/app/app.config.ts src/app/app.spec.ts src/styles.scss src/tailwind.css angular.json package.json
```

---

## Task 5: Manual verification of the nav (human gate)

Automated tests cover behavior; the M3 spec is visual and must be seen. This is the one deliberate visual change in the plan.

- [ ] **Step 1: Run the app**

```bash
npm run dev
```

- [ ] **Step 2: Check each item against the spec**

At a 430px-wide viewport with device emulation on:

- Nav renders on `/` and `/profile`; absent on `/decks/:deckId` and every other route.
- Container is 80px tall, sitting above the safe-area inset (no overlap with the home indicator).
- The active destination shows a 64×32 fully-rounded pill behind its 24px icon; the inactive one does not.
- The pill reads as an app-palette colour (`--surface-sky`), **not** a Material-generated azure. If it looks azure, Task 2 did not take effect.
- Labels are 12px medium; active label is `--text-primary`, inactive is `--text-secondary`.
- Toggle `data-theme="dark"` on `<html>` in devtools — every colour flips, no hardcoded light values.
- Tap targets are ≥ 44px (each item is 80px tall, full flex width).

- [ ] **Step 3: STOP for owner sign-off on the look**

The nav's appearance changed by design. Get explicit approval before committing. If rejected, the fallback is a minimal bar with no pill indicator — Tasks 1 and 4 (the dependency removal) stand regardless and do not depend on this choice.

---

## Task 6: Documentation

**Files:**

- Create: `docs/adr/0007-bottom-navigation-hand-rolled-m3-taiga-removed.md`
- Modify: `docs/adr/0002-widget-ownership-matrix.md`
- Modify: `.scratch/angular-migration/port-tracker.md`

**Interfaces:**

- Consumes: the decisions implemented in Tasks 1–4
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write ADR-0007**

Create `docs/adr/0007-bottom-navigation-hand-rolled-m3-taiga-removed.md`:

```markdown
# ADR-0007: Bottom navigation is hand-rolled to the M3 spec; Taiga UI removed

**Status:** Accepted
**Date:** 2026-07-16
**Supersedes:** the "Bottom navigation" row of ADR-0002

## Context

ADR-0002 assigned bottom navigation to Taiga UI's `TabBar` after finding no alternative:
Kendo's `BottomNavigation` is commercially licensed, standalone bottom-nav libraries are
stale (Angular 8/9 era), and Angular Material ships no bottom-nav component.

That search was re-verified against the installed packages and still holds:

- **Angular Material v22.0.4** ships 38 entry points, none nav-bar shaped, and no
  `MatNavigationBar` symbol in its typings. Its nav components — `mat-tab-nav-bar` (a top
  tab-group header with ink bar and pagination), `mat-nav-list`, `mat-sidenav`,
  `mat-toolbar` — are none of them a mobile bottom nav.
- **Material Web** has `md-navigation-bar`, but only in `labs/`; it never graduated and the
  project is in maintenance mode.
- **PrimeNG** has no equivalent — `Dock` is a macOS-style dock, `TabMenu` a horizontal tab menu.

What changed is the response, not the finding. Taiga UI cost **12 packages and 36 MB** — plus
a global LESS theme, an icon-asset copy step, and the `less` devDependency — to supply exactly
one component. Meanwhile `app-nav.ts` already hand-wrote every non-trivial part of that
component: tab visibility, fixed positioning, z-index, and safe-area padding. Taiga supplied
only glyph styling and two icons.

## Decision

**The bottom navigation is hand-rolled to the Material 3 navigation bar spec, and Taiga UI is
removed entirely** (12 packages, the LESS theme, the icon assets, the `--tui-*` token bridge,
`TuiRoot`, and the `less` devDependency).

ADR-0002 already set this precedent for swipeable rows: _"stays custom — no library ships this."_

The nav follows the M3 navigation bar spec rather than ad-hoc markup:

| Element          | Spec                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Container        | height 80px, `surface-container`                                     |
| Active indicator | 64×32, `corner-full`, `secondary-container`                          |
| Icon             | 24px; active `on-secondary-container`, inactive `on-surface-variant` |
| Label            | `label-medium`; active `on-surface`, inactive `on-surface-variant`   |

M3 was chosen because the app is already Material M3 throughout (35 files) and `styles.scss`
already bridges the `--mat-sys-*` roles to the app's `--sw-*` semantic tokens. The nav was the
**one surface not speaking M3** — it rendered in Taiga's design language via a separate
`--tui-*` bridge. Building to M3 fixes that inconsistency and costs nothing to theme: dark mode
flips through the existing token layer.

## Consequences

- **Two UI foundations remain** (Material/CDK, PrimeNG) plus Tailwind utilities — down from
  three. ADR-0002's ownership rule is otherwise unchanged.
- `--mat-sys-secondary-container` / `--mat-sys-on-secondary-container` are now pinned in the
  bridge. They were previously unpinned and fell through to `mat.$azure-palette`'s generated
  long tail; the M3 active indicator reads exactly those roles. This benefits every Material
  component reading them, not just the nav.
- **The nav's appearance changed by design** — an 80px M3 bar with a pill active indicator,
  replacing Taiga's styling.
- **Accepted deviation: 2 destinations, where M3 specifies 3–5.** Study and Practice cannot
  become destinations — they are deck-scoped flows (`/decks/:deckId/study`, `/quiz`, `/match`)
  with no deck-less entry point, and `study/` has no pages at all (it is the SRS engine).
  The 2-tab IA is deliberate: Home (your content) vs Profile (you); notifications reach via the
  home-header bell, settings and progress via profile. The progress area is also entirely
  unported. Adding destinations to satisfy a count would let the guidance wag the product;
  the bar is legible with two clear peers, and the component is built to spec so a third tab
  is one array entry.
```

- [ ] **Step 2: Update ADR-0002**

In `docs/adr/0002-widget-ownership-matrix.md`:

1. Change the bottom-navigation row to mark it superseded:

```markdown
| Bottom navigation | ~~Taiga UI `TabBar`~~ → **hand-rolled to M3 spec (ADR-0007)** | custom `bottom-nav` widget |
```

2. In **Consequences**, change "**Three UI foundations coexist** (Material/CDK, PrimeNG, Taiga UI addon-mobile)" to "**Two UI foundations coexist** (Material/CDK, PrimeNG)" and drop the Taiga clause.

3. Append to Consequences:

```markdown
- **Superseded in part by ADR-0007:** Taiga UI was removed entirely. Its evaluation of
  bottom-nav libraries (Kendo commercial, stale solo-maintainer libs, Material shipping none)
  was re-verified and still stands — what changed is that a 12-package, 36 MB dependency for
  one component is not worth it when the component's hard parts are already hand-written.
```

- [ ] **Step 3: Update the port tracker**

In `.scratch/angular-migration/port-tracker.md`, add to the "Known gaps" list:

```markdown
- **Bottom nav rebuilt to the M3 spec** (`shell/app-nav.ts`, ADR-0007) — Taiga UI removed
  entirely (12 packages), along with `@maskito` and `@ng-web-apis` (zero imports each).
```

- [ ] **Step 4: Format**

```bash
npx prettier --write docs/adr/0007-bottom-navigation-hand-rolled-m3-taiga-removed.md docs/adr/0002-widget-ownership-matrix.md .scratch/angular-migration/port-tracker.md
```

---

## Task 7: Final verification and commit

- [ ] **Step 1: Full verification**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: all PASS. Do not proceed on a failure — report it.

- [ ] **Step 2: Confirm the dependency count dropped**

```bash
node -p "Object.keys(require('./package.json').dependencies).length + ' deps'"
grep -c "taiga\|maskito\|ng-web-apis" package.json || echo "0 references — clean"
```

Expected: 22 fewer dependencies than the 40 at plan start (→ 18); zero references.

- [ ] **Step 3: Commit — explicit paths only**

Resolve Task 0 first. **Never `git add -A`** — 22 unrelated files are staged.

```bash
git add package.json package-lock.json angular.json \
  src/app/shell/app-nav.ts src/app/shell/app-nav.spec.ts \
  src/app/app.ts src/app/app.html src/app/app.config.ts src/app/app.spec.ts \
  src/styles.scss src/tailwind.css \
  docs/adr/0007-bottom-navigation-hand-rolled-m3-taiga-removed.md \
  docs/adr/0002-widget-ownership-matrix.md \
  docs/superpowers/specs/2026-07-16-angular-mvvm-and-dependency-cleanup-design.md \
  docs/superpowers/plans/2026-07-16-dependency-cleanup-and-m3-nav.md \
  .scratch/angular-migration/port-tracker.md

git commit -m "$(cat <<'EOF'
refactor: hand-roll bottom nav to M3 spec, drop Taiga UI and dead deps

Taiga UI (12 packages, 36 MB) existed solely to supply TuiTabBar for the
bottom navigation. Rebuild the nav by hand to the Material 3 navigation bar
spec — 80px container, 64x32 corner-full active indicator, label-medium —
themed through the --mat-sys-* roles styles.scss already bridges to the app's
semantic tokens. No library ships this widget: Angular Material v22 has no
navigation bar, Material Web's is labs-only, PrimeNG has no equivalent.

Also removes @maskito (4 packages) and @ng-web-apis (6 packages), which had
zero imports anywhere in src/ or configs, plus the `less` devDependency that
existed only for Taiga's LESS theme. 22 packages total.

Pins --mat-sys-secondary-container/-on-secondary-container, previously
unpinned and falling through to the generated azure palette — the exact roles
the M3 active indicator reads.

The nav's appearance changes by design; it was the one surface not speaking
M3. Accepted deviation: 2 destinations where M3 specifies 3-5 (ADR-0007).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Confirm the commit contains only intended files**

```bash
git show --stat HEAD
```

Expected: ~16 files. **No `settings/pages/*`, no `shared/ui/swipe-*`, no `shared/ui/select-*`** — if those appear, the staged port work leaked in; `git reset --soft HEAD~1` and redo Step 3 with explicit paths.

---

## Self-Review

**Spec coverage (Part 1):**

| Spec requirement                                          | Task |
| --------------------------------------------------------- | ---- |
| Remove 12 `@taiga-ui/*`                                   | 4    |
| Remove 4 `@maskito/*`, 6 `@ng-web-apis/*`                 | 1    |
| Remove `less` devDep                                      | 4    |
| `angular.json` icon glob + `.less` theme                  | 4    |
| `provideTaiga()`, `TuiRoot`, `<tui-root>`, `tui-root` CSS | 4    |
| `--tui-*` bridge + header comment                         | 4    |
| `app.spec.ts` assertion fix                               | 4    |
| Pin `secondary-container` roles                           | 2    |
| Hand-rolled nav to M3 spec                                | 3    |
| lucide icons, `routerLinkActive`, `aria-current`          | 3    |
| 2-destination deviation recorded                          | 6    |
| ADR-0007, ADR-0002 update, port-tracker                   | 6    |
| Verify incl. `npm run build`                              | 4, 7 |
| Manual visual check (light + dark, safe area)             | 5    |

No gaps. **Part 2 (MVVM extraction, bulk commands, store bootstrap, area barrels, CLAUDE.md rewrite, ADR-0008) is deliberately out of scope** — it is an independent subsystem and gets its own plan once this lands.

**Placeholder scan:** none. Every code step carries complete code; every command carries expected output.

**Type consistency:** `NavTab` (`path`/`icon`/`labelKey`/`exact`) is defined in Task 3 and used only there. `TAB_PATHS` derives from `TABS`, replacing the old standalone const. `AppNav`'s public surface (selector `ms-app-nav`, no inputs/outputs) is unchanged, so `app.ts`'s existing import in Task 4 stays valid. i18n keys `nav.label`/`nav.home`/`nav.profile` are verified present in `public/i18n/en.json`; `nav.decks` exists but is unused and left alone.

**Known risk flagged inline:** Task 3 Step 4 names the Tailwind v4 `group-[.is-active]:` variant as the likeliest failure point, with a concrete fallback.
