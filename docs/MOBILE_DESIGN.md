# Mobile & PWA Design

Behavior, interaction, PWA caveats. Code-level rules → [CODE_STYLE.md](CODE_STYLE.md).

**Portrait, touch-first, offline-first, installable PWA.** `index.html`: `viewport-fit=cover`, `maximum-scale=1`,
`user-scalable=no`, **`interactive-widget=resizes-visual`** (load-bearing, not boilerplate —
[ADR 0002](adr/0002-keyboard-covers-the-app.md); `resizes-content` collapses the keyboard measurement to zero on
Chrome/Firefox). Manifest: `display: standalone`, `orientation: portrait`.

---

## 1. Layout

One centered column, **`max-w-app`** (`--p-container-app`, 430px — `shared/ui/AppScreen`, every overlay). Always the
token, never a raw width. Breakpoints used in a handful of places by design.

- **Design at ~390–430px.** Content adapts _within_ the column. On big screens it stays centered — never edge-to-edge.
- **`dvh`, never `vh`** (`100vh` overflows on mobile Safari). `Sheet` caps at `max-h-[88dvh]`.
- **Fluid inside:** relative units, wrap, `min-w-0` on flex children so text truncates, `max-w-full` on media.
- **Standalone ≠ tab** — no URL bar, no browser back. Ship your own back affordance. Test both.
- **Orientation:** manifest locks portrait but the OS may rotate — letterbox, don't distort.
- **Respect Dynamic Type** — `--p-text-*` tokens + relative spacing.

## 2. Safe areas, viewport, keyboard

- `viewport-fit=cover` renders under the notch and home indicator — you **must** pad for insets.
- **Use the `theme.css` safe-area utilities**; compose `AppScreen`/`Sheet`/`HeaderBar`/`SpeedDial` rather than
  hand-rolling padding.
- **Keyboard:** keep the **focused input and the header** visible — the scroll body reveals the field, the shell stays
  anchored to the screen and the keyboard covers its bottom ([ADR 0002](adr/0002-keyboard-covers-the-app.md)). A page
  footer is `sticky bottom-0` with content passing behind it, but **goes `static` while the keyboard is up** and
  `AppNav` hides outright — WebKit re-clamps bottom-anchored boxes to the visual viewport, which would float them
  mid-screen. So the CTA rests at the end of the page, behind the keyboard, reached by scrolling. Put an action that
  must survive typing in the header (`CardEditorPage`'s Save), not the footer.
- **`overscroll-behavior: contain`** on scroll regions — no app bounce, no pull-to-refresh in standalone.

## 3. Touch targets

- **≥ 44px hit area** on anything tappable. `Button` `md`/`lg` comply; `sm` (36px) doesn't — only where padding makes up
  the difference.
- **Icon-only:** ≥44px **and** an `sr-only` label. Expand with padding, not a bigger icon.
- **≥ 8px between adjacent targets.** Dense rows still keep separable hit areas.
- **Kill double-taps:** `touch-action` on draggables, `-webkit-tap-highlight-color: transparent` + explicit `active:`.

## 4. Thumb zone

- **Primary nav and CTAs at the bottom** — `AppNav`, `SpeedDial`, bottom-rising sheets.
- **Destructive actions out of the resting thumb arc**, behind `ConfirmDialog`.
- Top-of-screen controls for **low-frequency** actions only.

## 5. Gestures & haptics

- **Never rely on hover.** Anything hover-revealed on desktop must be tap-reachable.
- **Every gesture needs a visible alternative** — swipe (`SwipeRow`) and long-press are accelerators, not the only path.
- **Discoverable and forgiving:** visible affordances, rubber-band past the commit point, deliberate threshold before a
  destructive swipe. One recognizer (`@use-gesture`); commit math pure in `shared/lib/gestures`.
- **Immediate press feedback:** `active:scale-[0.97]` + haptics on commit.
- **Haptics** (`shared/lib/haptics`): `tick()` 8ms, `impact()` 16ms, `success([12,40,24])`, preference-gated.
  **`navigator.vibrate` is ignored by iOS Safari** — progressive enhancement only.

## 6. Interactivity

- **Local writes are instant — don't fake loading.** Render optimistically; spinners only for genuinely async work.
- **Guard double-submit** — disable while pending and on success.
- **Debounce high-frequency input**; cancel in-flight work on unmount.
- **Don't hijack scroll.** Header/footer `shrink-0`, body `flex-1 overflow-y-auto`.
- **Inputs:** correct `inputMode`/`type`/`autocomplete`/`enterKeyHint`; `enterKeyHint="next"` between fields so the
  keyboard never has to be dismissed mid-form.
- **`select-none` on interactive chrome.** Long-press = intentional action, not accidental selection.

## 7. Sheets, menus, overlays

All on **`@base-ui/react`**, wrapped in `shared/ui/primitives/`: `Drawer` → `Sheet`/`ActionSheet`/`PromptSheet`;
`AlertDialog` → `ConfirmDialog` (`role="alertdialog"`, no outside-press dismiss); `Menu` (`primitives/dropdown-menu`) →
`FlyoutMenu`/`SortControl`, with the shared item sets in `shared/ui/menu-actions`. They give focus-trap, portal,
swipe-to-dismiss, `Escape`. Prefer them over hand-rolled overlays (`CardBrowser` is the one deliberate exception).

- **Bottom sheets over centered dialogs.** `Sheet` is canonical: grab handle, native swipe-to-dismiss, `max-h-[88dvh]`,
  `pb-safe`, top-rounded. On iOS it lifts above the keyboard via `Drawer.VirtualKeyboardProvider` — Safari demotes
  `position: fixed`, so hand-rolled `bottom` offsets lose.
- **Pick by job:** `Sheet`/`PromptSheet` = form or single input · `ActionSheet` = short list of choices · `FlyoutMenu` =
  anchored menu · `ConfirmDialog` = blocking yes/no · `SpeedDial` = primary-action cluster.
- **Long content scrolls _inside_ the sheet**, never past `88dvh`.
- **One overlay at a time.** Unavoidable layering respects the z-scale (backdrop `z-300`, popup `z-310`).
- **Dismissal obvious and cheap:** backdrop tap, swipe-down, visible close button, `Escape`.
- **Backdrop:** token scrim, not opaque black — context stays sensed.

## 8. Motion feel

- **Communicates, never decorates.** Says nothing → cut it.
- **Spring physics** for finger-driven motion; eased tweens for enter/exit chrome.
- **~150–300ms for in-page feedback.** Longer feels sluggish in the hand. **Full-height surfaces travel further and get
  longer** — `Sheet` is `450ms cubic-bezier(0.32,0.72,0,1)`, the iOS sheet curve, and `data-swiping:duration-0` hands
  the motion straight to the finger mid-swipe.
- **Direction encodes hierarchy:** sheets rise and fall; forward nav moves inward, back outward. No lateral slides
  between peers.
- **Only `transform`/`opacity`.**
- **Interruptible & reversible** — a half-open sheet swiped back returns. Let the gesture drive a `MotionValue`, not a
  fixed animation.
- **Always honor `prefers-reduced-motion`.**

## 9. Visual hierarchy

- **Semantic tokens only.** No raw hex, no per-component `dark:`.
- **One primary action per screen** (`primary` → `secondary` → `ghost`). Never two competing CTAs.
- **Elevation by role:** `shadow-rest` / `shadow-interactive` / `shadow-elevated` — not by eye.
- **Generously rounded, glassy surfaces** (`rounded-2xl`/`rounded-card-*`, `GlassCard`). Tiles read rounded, not
  near-square.
- **Rhythm:** consistent spacing scale, group related controls. Mobile shows **one task at a time**.
- **Icons:** `lucide-react`, sized to the type scale, always with a label or `sr-only` text.

## 10. States

All four on every async surface — a missing state reads as a crash.

- **Loading** — skeleton/spinner, never blank (`widgets/splash` for first paint); skip for instant local writes (§6).
- **Error** — the problem **plus a retry path**.
- **Empty** — `Empty` (`shared/ui/primitives/empty.tsx`, `panel`/`hero`); put "create" in the toolbar too.
- **Offline** — §11.

## 11. Offline-first

- **RxDB is the local source of truth** — reads never touch the network. **Never block UI on a round-trip.**
- **Workbox precache** makes the shell available offline after first load.
- **Caveat — no network-status UI yet** (no `navigator.onLine`). Fine today; add an indicator when sync/cloud/auth land,
  don't retrofit into local-only flows.

## 12. Install & manifest

- **Manifest:** `standalone`, `portrait`, `theme_color #091A7A`, `background_color #ADC8FF`, 192/512 + a **maskable**
  512 (required for Android).
- **iOS:** `apple-mobile-web-app-*` meta + `apple-touch-icon`. No `beforeinstallprompt` (manual Add to Home Screen);
  status-bar style limited to `default`/`black`/`black-translucent`; test standalone separately.

## 13. Service-worker updates

- `registerType: 'prompt'` — **never auto-applied.** `UpdatePrompt` asks on launch, on `visibilitychange`, on `online`,
  and every 15 min for a window left open all day; it shows a persistent toast (fixed id, so never a stack) with a
  Reload action. **`registration.waiting` is the ground truth**, not the `updatefound` event — workbox-window stops
  reporting updates it classifies as external, which loses every update after the first in an app that stays open.
- **Don't switch to `autoUpdate`** — a silent reload mid-study loses the user's place.
- SW is **off in dev** — verify against `npm run build && npm run preview`.

## 14. On-device performance

Assume a low-end device.

- **60fps:** `transform`/`opacity` only.
- **Virtualize long lists** (`content-visibility` or windowing).
- **Passive scroll/touch listeners.**
- **Ship less JS:** route-split, keep the bundle lean.

## 15. Accessibility

- **Honor `prefers-reduced-motion`.**
- **Focus & labels:** visible `focus-visible` ring, accessible name, correct roles. Keep the Base UI
  focus-trap/labelling wired.
- **Contrast:** WCAG AA in **both** themes.
- **Respect font scaling** (§1) — large text must never clip.
