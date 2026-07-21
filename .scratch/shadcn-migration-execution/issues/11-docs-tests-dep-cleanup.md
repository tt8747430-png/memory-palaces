# 11 — Docs, tests & dependency cleanup (close-out)

Type: task
Blocked by: 05, 06, 07, 08, 09, 10
Status: open

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
