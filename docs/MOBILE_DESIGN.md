# Mobile & PWA Design

How Mindscape should behave and feel on a phone and as an installed app. Code-level engineering rules (components, hooks, Tailwind, React performance, animation APIs) live in [CODE_STYLE.md](CODE_STYLE.md); this doc is product behavior, interaction, and PWA caveats. Each rule points at the real file that implements it.

**What this is:** a **portrait, touch-first, offline-first, installable PWA** — `index.html` sets `viewport-fit=cover` and `interactive-widget=resizes-visual`; the manifest (`vite.config.ts`) is `display: standalone`, `orientation: portrait`. Pinch-zoom is locked **only in the installed app** (a boot snippet appends `maximum-scale=1` when `(display-mode: standalone)` matches — ADR-0010); the browser tab stays zoomable for WCAG 1.4.4.

> Paths below point at the current tree. Where a surface is named but not yet ported (§ the rebuild is View-layer only — see CLAUDE.md), the rule still binds: implement it that way when the surface lands.
>
> This is a **web PWA, not React Native**. The "Mobile Design System" template's RN/Flutter APIs (FlatList, SecureStore, `useNativeDriver`, const constructors) **do not apply** — the UX _principles_ below do.

---

## 1. Responsive layout & screen adaptation

The app is **phone-first**, not a breakpoint grid. It renders as a **single centered column capped at `max-w-[430px]`** (see `shared/ui/app-screen.tsx`, and every `Drawer`/overlay). Breakpoints (`sm:`/`md:`/`lg:`) are used in only a handful of places by design.

- **Design at ~390–430px width.** Content adapts _within_ the column (wrap, stack, resize), not across desktop breakpoints. On tablet/desktop or a maximized PWA window, the column stays centered — never stretch UI edge-to-edge on a big screen.
- **Use `dvh`, never `vh`, for full-height regions.** Dynamic viewport units account for the mobile URL bar and on-screen keyboard (the `Sheet` caps at `max-h-[88dvh]`; page shells use `dvh`). `100vh` overflows on mobile Safari.
- **Fluid inside the column:** relative units, `flex`/`grid` with wrap, `min-w-0` on flex children so text truncates instead of overflowing, `max-w-full` on media. Reserve `sm:`/`md:` for the rare case a wider phone genuinely benefits.
- **PWA standalone ≠ browser tab.** In `display: standalone` there is no browser chrome (URL bar, back button) — the app must provide its own back affordance and never depend on browser UI. Test both modes.
- **Orientation:** the manifest locks `portrait`, but the OS may still rotate — don't break in landscape; let the centered column letterbox rather than distort.
- **Respect Dynamic Type / user font scaling:** the entire token scale is **rem-based** (ADR-0011) — type, spacing, radii, and the column all scale with the user's OS/browser text-size setting as one system. Only hairline borders, shadow offsets, and `env()` insets stay px. Never reintroduce a px font size.
- **Desktop scrollbars:** scroll regions get `scrollbar-width: thin; scrollbar-color: var(--border) transparent`, scoped to `(pointer: fine)` — slim and theme-correct in the web tab and desktop PWA, invisible no-op on phones. `.scrollbar-hide` stays reserved for carousels/chip rows, never for primary scroll surfaces.

## 2. Safe areas, viewport & keyboard

- `viewport-fit=cover` lets content render under the notch and home indicator — you **must** pad for insets.
- **Use the safe-area utilities in `theme.css`** (`env(safe-area-inset-*)` for all four sides, plus a bottom-nav offset `calc(7rem + env(safe-area-inset-bottom))` and `pb-safe`). Compose the primitives that already apply them — `app-screen.tsx`, `drawer.tsx`, `sticky-bar.tsx`, `speed-dial.tsx` — instead of hand-rolling padding.
- **Keyboard (ADR-0010):** `interactive-widget=resizes-visual` — full pages hold still and the keyboard overlays their lower edge; **only Drawers lift** (spec 07-14). Lifting is owned by the primitive: the shared `Drawer` bakes Base UI's `Drawer.VirtualKeyboardProvider` into its anatomy, so every drawer is keyboard-aware by construction. **Hand-made drawers are banned** — one built outside the shared component misses the keyboard handling by definition. Never hand-roll a `visualViewport`-driven **lift** (the old `--kb` transform raced iOS's caret-reveal pan and flickered). **Full pages gain scroll capacity instead (ADR-0010 amendment):** the shell `KeyboardInsetProvider` publishes `--kb-inset`, and `AppScreen`'s scroll region consumes it as `padding-bottom` + `scroll-padding-bottom` — while the keyboard is open, every page can scroll exactly far enough to reach any control (WebKit never shipped `interactive-widget`, so this JS inset is the only cross-platform fix). **Form layout rules:** top-align form content where the design allows; a centered form must center overflow-safely (`margin-block: auto` spacers — bare `justify-content: center` clips its top when it overflows and becomes unscrollable, which is exactly the login-page trap).
- **Prevent overscroll chaining** on scroll regions (`overscroll-behavior: contain`) so an inner scroll doesn't bounce the whole app or trigger the browser's pull-to-refresh in standalone.

## 3. Touch targets & spacing

- **≥ 44px hit area on anything tappable.** `Button` `md`/`lg` (`h-11`/`h-12`) comply; `sm` (`h-9` ≈ 36px) does **not** — only use it where padding brings the tap area to ≥44px. shadcn's generated size variants are **retuned once at the source** (default → 44px, `lg` → 48px) so pages inherit compliance instead of opting into it.
- **Icon-only controls** need a ≥44px hit area **and** an `sr-only` label (`shared/ui/icon-button.tsx`). Expand a small glyph's tappable area with padding, not a bigger icon.
- **≥ 8px between adjacent targets** so a ~7mm fingertip can't hit two at once. Dense rows (`SettingsRow`, `SwipeRow`) must still keep separable hit areas.
- **Kill accidental double-taps:** `touch-action` on draggables (`touch-none` on the sheet grab handle), and disable the tap-highlight flash (`-webkit-tap-highlight-color: transparent`) in favor of explicit `active:` states.

## 4. Thumb zone & reachability

One-handed use: the bottom third is easy, the top is a stretch.

- **Primary nav and CTAs live at the bottom** — `shell/app-nav.tsx`, `shared/ui/speed-dial.tsx`, and drawers that rise from the bottom (`drawer.tsx`, `action-drawer.tsx`, `prompt-drawer.tsx`).
- **Keep destructive actions out of the resting thumb arc** and behind confirmation — route them through `shared/ui/confirm-dialog.tsx`.
- Top-of-screen controls (back, overflow) are acceptable for **low-frequency** actions only.

## 5. Gestures, feedback & haptics

- **Never rely on hover** — there is none on touch. Anything exposed on hover on desktop must be reachable by tap.
- **Every gesture needs a visible alternative.** Swipe (`shared/ui/swipe-row.tsx`, `swipe-actions.tsx`) and long-press (`shared/lib/use-long-press.ts`) are accelerators, not the only path — provide a button too.
- **Make gestures discoverable and forgiving:** show affordances (the sheet grab handle, swipe action colors), give an elastic/rubber-band boundary (the `Sheet` uses `dragElastic` bottom `0.18`), and require a deliberate threshold before committing a destructive swipe.
- **Give immediate press feedback:** `active:scale-[0.97]` (see `Button`) + haptics on commit.
- **Haptics** (`shared/lib/haptics`): `tick()` (8ms), `impact()` (16ms), `success([12,40,24])`, gated by a user preference (`setHapticsEnabled`). **Caveat:** these use `navigator.vibrate`, which works on Android/Chromium but is **ignored by iOS Safari** — treat haptics as progressive enhancement, never as the only feedback.

## 6. Interactivity & input

- **Local writes are instant — don't fake loading.** A feature command calls `store.save()` → RxDB → reactive query → store updates, so the UI reflects the change immediately. Render optimistically; reserve spinners for genuinely async work (import, future network calls), not local mutations.
- **Guard against double-submit:** disable the action while it's pending and on success; never let a second tap fire the same command.
- **Debounce high-frequency input** (search over decks/cards, autosave in editors) and cancel in-flight work on unmount.
- **Momentum & scroll:** let native momentum scrolling do the work; don't hijack scroll. Use `overflow-y-auto` scroll regions (header/footer `shrink-0`, body `flex-1 overflow-y-auto`, as in `Sheet`) so chrome stays put while content scrolls.
- **Inputs:** set the right `inputMode`/`type`/`autocomplete`/`enterKeyHint` so the correct on-screen keyboard and return-key label appear; keep the submit action reachable above the keyboard — backed by the `--kb-inset` scroll capacity (§2), so "reachable" means _scrollable to_, never lifted. **Text inputs render at ≥16px** (`--ms-text-title`), baked into the shared `Input`/`Textarea` — this is what prevents iOS focus auto-zoom without blocking pinch (ADR-0010); never shrink an input's font below it.
- **Selection & context:** disable text selection on interactive chrome (`select-none` on drag handles, buttons); reserve long-press for intentional actions, not accidental text selection.

## 7. Menus, Drawers & overlays

All overlays are built on **`@base-ui/react`** headless primitives (e.g. `Dialog` in `shared/ui/drawer.tsx`), which provide focus-trap, portal, and `Escape`/backdrop dismissal. Prefer these primitives over hand-rolled overlays.

- **Prefer Drawers (bottom sheets) over centered dialogs on mobile.** They land in the thumb zone and feel native. The Drawer is the canonical pattern: rises from the bottom (`data-[starting-style]:translate-y-full` slide + backdrop fade), has a **grab handle**, **drag-to-dismiss**, caps at **`max-h-[88dvh]`** so the context behind stays visible, pads `pb-safe`, and rounds only the top (`rounded-t-card-featured`). It is built on Base UI `Drawer` with `VirtualKeyboardProvider` baked in (ADR-0010), **is named `Drawer`** (the glossary term), and is **the only way to build one**.
- **Snap points are first-class (ADR-0010):** Drawers whose content exceeds ~60dvh (content editor, in-study editor, card filter) ship a **half ↔ full detent pair** via Base UI `snapPoints`; short Drawers (action drawers, confirms, single-input prompts) stay at content height — a half detent on a three-item list would clip it. Every detent is a real UI state and is designed and verified as one.
- **Pick the right component for the job:**
  - `Sheet` / `PromptSheet` — a form or a single input in context.
  - `ActionSheet` — a short list of choices (the mobile equivalent of a menu).
  - `FlyoutMenu` / `OverflowMenuButton` — a compact contextual menu anchored to a control.
  - `ConfirmDialog` — a blocking yes/no, especially destructive confirms.
  - `SpeedDial` — a bottom-anchored primary-action cluster.
- **Long content scrolls _inside_ the sheet**, not the page: `shrink-0` header/footer, `flex-1 overflow-y-auto` body. The sheet must never grow taller than `88dvh`.
- **One overlay at a time.** Don't stack a sheet over a sheet; close the first or compose steps inside one. If layering is unavoidable, respect the z-scale (`Sheet` backdrop `z-300`, popup `z-310`).
- **Dismissal must be obvious and cheap:** tap-outside on the backdrop, swipe-down, an always-visible close button (`aria-label`), and `Escape` for keyboard. Never trap the user in a sheet.
- **Backdrop:** dim with the token-based scrim (`color-mix(... var(--primary) 28%)`), not opaque black; the user should sense the context behind.

## 8. Animation & motion feel

Code-level animation rules (which library, which properties) are in [CODE_STYLE.md §9](CODE_STYLE.md). This is about _feel_.

- **Motion communicates, it doesn't decorate.** Every transition should convey a spatial relationship (where something came from / went) or a state change. If it says nothing, cut it.
- **Prefer spring physics** (`motion`) for anything the finger drives — drag, dismiss, reorder — so it tracks and settles naturally. Use short eased tweens for enter/exit chrome (the `Sheet` slide is a `300ms ease-out`).
- **Keep it quick:** ~150–300ms for most UI transitions. Longer feels sluggish on a device held in the hand.
- **Direction encodes hierarchy:** sheets rise from the bottom and fall back down; forward navigation (list → detail) moves inward, back moves outward. Don't slide laterally between peers as if there were depth.
- **Two animation systems, one boundary (ADR-0012):** **between pages** it's the View Transitions API driven through the router (direction via transition types, shared-element morphs via `view-transition-name`, compositor-run); **within pages** — anything the finger drives — it's `motion`. If an animation crosses a navigation it's a view transition; if it tracks a pointer it's `motion`.
- **Animate only `transform`/`opacity`** to hold 60fps (details in CODE_STYLE §9); never animate layout props.
- **Interruptible & reversible:** a half-open sheet you swipe back down should return, not jump. Let gestures drive the value (`style={{ y }}`) rather than firing a fixed animation.
- **Always honor `prefers-reduced-motion`** — replace slides/scales with a plain fade or cut.

## 9. Visual design & hierarchy

- **Semantic tokens only** — `bg-card`, `text-heading`, `border-border`, `bg-primary`, and the `--p-*` scale (see CODE_STYLE §5). No raw hex, no per-component `dark:`; dark mode follows the `[data-theme='dark']` token remap automatically.
- **One primary action per screen.** Everything else is secondary/tertiary (`Button` variants: `primary` → `secondary` → `ghost`). Don't present two competing CTAs.
- **Consistent elevation scale:** rest surfaces (`shadow-rest`), interactive (`shadow-interactive`), and floating/overlay (`shadow-elevated`) — pick by role, not by eye.
- **Generously rounded, glassy surfaces:** cards and tiles use large radii (`rounded-2xl`/`rounded-card-*`); `GlassCard`/glass tokens for translucent layers. Tiles read as rounded, not near-square.
- **Rhythm & density:** a consistent spacing scale and comfortable line length; group related controls, separate unrelated ones. Mobile shows **one task at a time** — resist cramming.
- **Iconography:** `lucide-react`, sized to the type scale, always paired with a label or `sr-only` text — never an unlabeled icon as the sole meaning.

## 10. States: loading, error, empty, offline

Every async surface must handle all four — a missing state reads as a crash on mobile.

- **Loading** — skeleton/spinner, never a blank screen (`shell/splash-overlay.tsx` for first paint, `shared/ui/skeleton.tsx` thereafter); but skip it for instant local writes (§6).
- **Error** — show the problem **with a retry path**, not a dead end.
- **Empty** — use `shared/ui/empty.tsx`; put the primary "create" action in the toolbar, not only in the empty state.
- **Offline** — see §11.

## 11. Offline-first behavior

- **RxDB (IndexedDB) is the local source of truth** — reads never touch the network, so screens render instantly and the app is fully usable with no connection. Render cached data immediately; **never block the UI on a network round-trip**.
- **Workbox precache** (`vite.config.ts`: `globPatterns: ['**/*.{js,css,html,svg,png,woff2}']`, `cleanupOutdatedCaches`, `clientsClaim`) makes the app shell available offline after first load.
- **Caveat — there is no network-status UI yet** (no `navigator.onLine` handling in `src/`). That's fine today because nothing in the read/study path needs the network. When network-dependent features land (sync, cloud media, auth), add an offline indicator and graceful degradation then — don't retrofit it into local-only flows now.

## 12. Install & manifest

- **Manifest** (`vite.config.ts` `VitePWA`): `display: standalone`, `orientation: portrait`, `theme_color #091A7A`, `background_color #ADC8FF`, 192/512 icons + a **maskable** 512 (required for Android adaptive icons).
- **iOS home-screen** meta (`index.html`): `apple-mobile-web-app-capable=yes`, **`apple-mobile-web-app-status-bar-style=black-translucent`** — the app draws edge-to-edge under the status bar, and the shell paints a contrast-safe cap behind the (always-white) status text: navy in the light theme, the dark bg tone in dark. `apple-mobile-web-app-title=Mindscape`, `apple-touch-icon`. **Caveats:** iOS has no `beforeinstallprompt` — install is manual "Add to Home Screen"; always test standalone mode separately from the browser tab.
- **The status bar follows the theme:** `index.html` ships **two** `theme-color` metas with `media="(prefers-color-scheme: light|dark)"` — dark-mode Chromium ignores a single un-attributed tag — and the theme provider updates **both** on every `data-theme` switch — by **removing and re-appending fresh meta nodes, never mutating `content` in place** (iOS Safari browser mode often ignores in-place mutations; recreating the node is the established workaround) — so Android's status bar (and desktop PWA chrome) always matches the app regardless of the OS scheme. iOS standalone ignores `theme-color` entirely: there the visible status-bar color is whatever the page paints at the top — the contrast-safe cap. The manifest's static `theme_color` is only the install-time default. **Verify on a real device** — the iOS simulator misrenders both mechanisms.

## 13. Service-worker updates

- `registerType: 'prompt'` — **updates are never auto-applied.** `shell/update-prompt.tsx` uses `virtual:pwa-register/react`, checks for a new SW hourly **and** on `visibilitychange`, and when one is waiting shows a **persistent `sonner` toast** (`update.*` i18n keys) with a **Reload** action that calls `updateServiceWorker(true)`.
- **Don't switch to `autoUpdate`** — a silent reload mid-study would lose the user's place. Keep the confirm step.
- `devOptions.enabled: false` — the SW is **off in dev**; verify PWA/offline/update behavior against `npm run build && npm run preview`, not `npm run dev`.

## 14. On-device performance

Assume a low-end device with tight CPU/memory.

- **60fps animations**: `transform`/`opacity` only (CODE_STYLE §9).
- **Virtualize long lists** (decks, cards) with CSS `content-visibility` or windowing; don't render thousands of rows.
- **Passive scroll/touch listeners** (`{ passive: true }`) so gestures don't block scrolling.
- **Ship less JS**: route-split pages (`React.lazy`) and keep the bundle lean — CODE_STYLE §7–§8.

## 15. Accessibility & reduced motion

- **Honor `prefers-reduced-motion`** — gate non-essential transitions to a fade/cut.
- **Focus & labels:** every interactive element needs a visible `focus-visible` ring, an accessible name (`aria-label`/`sr-only`), and correct roles — the `@base-ui` primitives handle focus-trap and labelling for overlays; keep those wired up.
- **Contrast:** verify token pairings meet WCAG AA in **both** themes (they remap under `[data-theme='dark']`).
- **Respect user font scaling** (§1) so large-text settings never clip content.
