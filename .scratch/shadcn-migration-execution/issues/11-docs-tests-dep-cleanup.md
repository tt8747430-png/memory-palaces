# 11 — Docs, tests & dependency cleanup (close-out)

Type: task
Blocked by: 05, 06, 07, 08, 09, 10
Status: resolved

## Question

Final close-out (handoff §0 removal + §5 + §6), only once every Sheet site is off `vaul`:

- **Remove `vaul`** from `package.json` (all Sheet sites now on Base UI Drawer). Confirm no residual
  imports. Drop `shadcn` package unless a component depends on `shadcn/tailwind.css` (record any
  exception).
- **Tests (§5):** ensure every named colocated `*.test.tsx` is on the compound API and green —
  `button`/`GradeButtons`/`SocialButtons`/`Switch`/`SegmentedControl`/`Avatar`/`StatTile`/
  `SettingsRow`/`SrsStatusChip`/`StudyOverviewCard`/`WordReveal`/`EmojiField`/`FlyoutMenu`/
  `use-long-press`/`gestures`/`use-optimistic-patch`.
- **Docs (§6):** `docs/MOBILE_DESIGN.md` + `docs/CODE_STYLE.md` §10 — Base UI `Drawer` swipe
  replaces `vaul`; document `VirtualKeyboardProvider` for iOS; `SwipeRow` now on `@use-gesture`.
  `docs/UBIQUITOUS_LANGUAGE.md` — note `Combobox` is really a Select (optional rename, out of scope).
- Final full verify gate green.

## Answer

Landed — migration closed out. **Final gate: `tsc --noEmit` clean · ESLint 0 errors (2 pre-existing
`.scratch/*` warnings) · Vitest 540/540 · `npm run build` (tsc + vite + PWA) succeeds.**

- **Deps:** `vaul` removed from `package.json` + lockfile (`npm install`); no residual imports (only a
  historical comment in `Sheet.tsx` explaining the iOS rationale). `shadcn`/`shadcn-ui` were never
  installed — recipes were hand-adapted (ticket 01), so nothing to drop; no dependency on
  `shadcn/tailwind.css`. Net dep delta for the whole migration: **+`class-variance-authority`**,
  **`@base-ui/react` ^1.5→^1.6**, **−`vaul`** (`@use-gesture`/`@dnd-kit`/`motion`/`sonner` kept).
- **Tests (§5):** all named colocated tests present + green within the 540 (Switch→`primitives/switch.test`,
  Avatar→`primitives/avatar.test`, `gestures.test` rewritten for the bidirectional math). Note: no
  `button.test.tsx` exists (the §5 list named it optimistically; there never was one — nothing to update).
- **Docs (§6):** `MOBILE_DESIGN.md` §7 overlays rewritten (Base UI `Drawer`/`AlertDialog`/`Menu`
  primitives, native swipe-to-dismiss, `VirtualKeyboardProvider` for iOS, `initialFocus`; CardBrowser
  full-screen-Dialog exception) + gesture bullets updated to `@use-gesture`/`Drawer`. `CODE_STYLE.md`
  passive-listener rule updated to the `@use-gesture` recognizer + `Drawer` swipe (§10 dnd-kit section
  left intact — accurate + untouched). `UBIQUITOUS_LANGUAGE.md` flags `Combobox` = a Select (rename
  out of scope).

**Migration complete — all 11 tickets resolved.** Two behavior-sensitive items remain owed to
**on-device iOS/touch verification** (can't be exercised in jsdom): (05) Drawer keyboard-lift parity +
swipe-dismiss not hijacking inner controls; (06) SwipeRow arm/commit/tap-vs-drag feel.
