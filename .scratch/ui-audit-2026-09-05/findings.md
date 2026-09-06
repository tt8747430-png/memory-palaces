# Mindscape UI + app shell audit — 2026-09-05

Audit only. Nothing fixed. Branch `one-header-chrome` @ `b236147`.

## Baseline

| Command | Result |
| --- | --- |
| `npm run typecheck` | **pass** (exit 0, no output) |
| `npm run lint` | **pass** (exit 0, no output) |
| `npm run test` | **pass** — 245 files passed / 3 skipped (248); 1259 tests passed / 8 skipped (1267); 37.6 s |
| `npm run build` | **pass** — 468 ms; entry `index-*.js` 897.58 kB (273.80 kB gz), `ui-*.js` 576.45 kB (187.31 kB gz); 2 chunk-size warnings |

Docs read first: `docs/CODE_STYLE.md` (§4, §4a, §5, §7–11), `docs/adr/0001`, `docs/adr/0002`,
`docs/UBIQUITOUS_LANGUAGE.md`, `docs/DECK_SETTINGS_UI_STATUS.md`, `docs/MOBILE_DESIGN.md`.

Severity key: **broken** (wrong on screen / wrong behaviour) · **inconsistent** (two answers to one
question) · **dead** (unreachable) · **risky** (correct today, one edit from wrong, or a claim the code
does not back).

---

## Pass 1 — Token layer

### 1.1 · broken · `src/shared/lib/cn.ts:4` + `src/styles/theme.css:9-15,40-45`
**tailwind-merge is not told the app's theme, so it deletes a font size whenever a colour is in the same `cn()`.**

Every type size (`text-tiny|label|body|sub|title|headline|entry`) and every text colour
(`text-heading`, `text-muted-foreground`, `text-accent`, `text-primary`, `text-faint`, `text-warning`,
`text-success`, `text-destructive`, `text-foreground`, `text-info-foreground`, `text-rating`, …) are
custom names. `twMerge` cannot tell them apart, puts all of them in one conflict group, and keeps only
the last.

Proven at runtime (temporary vitest render, since deleted):

```
FieldLabel emitted class:  "font-medium text-heading"      // text-label GONE
cn('text-sub font-semibold text-heading')   -> "font-semibold text-heading"
cn('truncate text-label', 'text-muted-foreground') -> "truncate text-muted-foreground"
cn('h-11 … px-3.5 text-entry text-foreground')     -> "h-11 … px-3.5 text-foreground"
```

Trigger: any screen with a form field, a sheet, a dialog or a header subtitle.
Wrong outcome (the unconditional cases — single literal, no ternary):

| Site | Class deleted | What renders instead |
| --- | --- | --- |
| `src/shared/ui/primitives/field.tsx:27` | `text-label` (12px) | every **field label** in the app inherits `body`'s size — `body` sets no `font-size`, so **16px** |
| `src/shared/ui/primitives/field.tsx:47` | `text-label` | field description at inherited size |
| `src/shared/ui/primitives/field.tsx:60` | `text-label` | field **error** text at inherited size |
| `src/shared/ui/primitives/drawer.tsx:124` | `text-sub` (14px) | every sheet title at `h2`'s 16px |
| `src/shared/ui/primitives/drawer.tsx:141` | `text-label` | every sheet description at `p`'s 14px |
| `src/shared/ui/primitives/input.tsx:9` | `text-entry` (16px) | saved only by the `input {font-size:var(--p-text-entry)}` base rule — the utility that documents the iOS-zoom guard is dead |
| `src/shared/ui/primitives/textarea.tsx:9` | `text-entry` | same |
| `src/shared/ui/primitives/alert-dialog.tsx:65` | `text-headline` (20px) | confirm-dialog title at `h2`'s 16px |
| `src/shared/ui/primitives/alert-dialog.tsx:82` | `text-body` | dialog body at `p`'s 14px (no visible change) |
| `src/shared/ui/primitives/dropdown-menu.tsx:125` | `text-body` | menu item at inherited size |
| `src/shared/ui/ActionSheet.tsx:110`, `:132` | `text-body` | action-sheet rows + cancel at inherited size |
| `src/shared/ui/ConfirmDialog.tsx:79` | `text-sub` | dialog cancel at inherited size |
| `src/shared/ui/ActionPill.tsx:34` | `text-label` | pill label at inherited size |
| `src/shared/ui/header/Header.tsx:149` + `ScreenHeader.tsx:25` | `text-label` | **every screen's header subtitle** at inherited size |

64 `cn()` call sites lose at least one class in total (scan script: join the call's static literals,
`twMerge`, diff). The remainder are ternary branches and need eyeballing one by one.

Smallest fix: replace `twMerge` with `extendTailwindMerge` declaring `font-size` = the seven `text-*`
scale names, so colours and sizes stop colliding. Then re-run the scan; the residue is real conflicts.

### 1.2 · inconsistent · `src/styles/tokens.css:197-200` vs `:265`
**Four of the five shadow roles have no `[data-theme='dark']` counterpart.**
`--shadow-card` is redefined for dark (`oklch(0% 0 0 / .3)`, `/ .5`). `--shadow-rest`,
`--shadow-featured`, `--shadow-interactive`, `--shadow-elevated` are not — they stay
`oklch(var(--p-tint-steel) / .09….22)`, i.e. a **29 %-lightness** tint at ≤22 % alpha.
Trigger: any screen in dark mode. 91 call sites (`shadow-rest` 49, `shadow-elevated` 18,
`shadow-interactive` 17, `shadow-featured` 7) versus `shadow-card`'s 3.
Wrong outcome: in dark mode an `ActionSheet`/`Combobox` popup (`shadow-elevated`) and every settings
row (`shadow-rest`) sit flat against the surface — the exact problem `--shadow-card` was given a dark
override for. Smallest fix: give the four a dark block beside `--shadow-card`.

### 1.3 · inconsistent · `src/styles/tokens.css:34-35`
`--p-text-sub: 14px` and `--p-text-body: 14px` are the same value under two names, both exposed
(`theme.css:11-12`) and both in use (`text-sub` 59 sites, `text-body` 35). Nothing in the codebase or
CODE_STYLE says which a given piece of type should take. Smallest fix: pick one, or write down the
distinction.

### 1.4 · inconsistent · `src/styles/tokens.css:70` + `theme.css:69`
`--radius-pill: 9999px` duplicates Tailwind's built-in `rounded-full`. `rounded-full` is used 80
times, `rounded-pill` 11 — including inside the same file (`Header.tsx:162,179,182` use `pill`,
`SpeedDial.tsx:101,103,106,124` use `full`). CODE_STYLE §5 says Tailwind's own radius defaults are off
the scale as surely as an arbitrary value. Smallest fix: one name.

### 1.5 · inconsistent · `src/styles/theme.css:95` vs three re-derivations
`--app-bottom-inset: max(0.75rem, env(safe-area-inset-bottom))` is re-spelled by hand at
`src/shared/ui/SpeedDial.tsx:21` (`bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]`)
and `src/widgets/bottom-nav/ui/AppNav.tsx:37,51`. Change the token and the dial and the nav drift.
Smallest fix: `bottom-[calc(var(--app-bottom-inset)+0.75rem)]` — but note `AppNav.tsx:37` deliberately
*writes* the token, so it must keep the literal.

### 1.6 · dead · `index.html:69`
`document.documentElement.dataset.display = 'installed'` — no CSS rule, no TS read
(`grep -r "data-display\|dataset.display" src` → nothing).

### 1.7 — checked, clean
Every `var(--x)` reference resolves; every `--z-*` rung is consumed (`--z-toast` via
`AppProviders.tsx:52`); the `[data-scene]` blocks are held to `CHROME_TOKENS` by six tests; no `:root`
token is orphaned once `@theme inline` names are excluded.

---

## Pass 2 — Tailwind

### 2.1 · broken · `pb-28` on `AppScreen`'s scroller never applies
`AppScreen.tsx:123` composes `cn(…, SCROLL, scrollInset, className)` where `scrollInset` is `pb-safe`.
`twMerge('pb-safe','pb-28')` keeps **both** (it does not know `pb-safe`), so both land on `<main>`; in
`dist/assets/index-*.css` `.pb-28` is at byte 58028 and `.pb-safe` at 99571 — same specificity, later
wins. `pb-28` is therefore inert on:
`src/pages/achievements/ui/AchievementsPage.tsx:41`, `src/pages/badges/ui/BadgesPage.tsx:18`,
`src/pages/badge-detail/ui/BadgeDetailPage.tsx:44`,
`src/pages/achievement-detail/ui/AchievementDetailPage.tsx:37`,
`src/pages/streak/ui/StreakPage.tsx:31`.
Trigger: scroll to the end of `/badges`, `/achievements`, `/streak` on a phone.
Wrong outcome: 34 px of clearance (`env(safe-area-inset-bottom)`) instead of the intended 112 px.
Smallest fix: those pages want the frame's `gutter`, not a `className`.

### 2.2 · inconsistent · type sizes off the scale
CODE_STYLE §5: "Every size in the app is one of these six names … never a raw length."
Off-scale sizes in shipped code:

| Site | Class |
| --- | --- |
| `src/shared/ui/EmojiField.tsx:41,55` | `text-3xl` |
| `src/shared/ui/primitives/empty.tsx:50` | `text-3xl` |
| `src/shared/ui/DeckCover.tsx:20` | `text-2xl` (default prop) |
| `src/pages/settings/ui/SettingsPage.tsx:132` | `text-xl` |
| `src/pages/deck-settings/ui/DeckCoverPicker.tsx:36` | `text-3xl` |
| `src/pages/archived-decks/ui/ArchivedDecksPage.tsx:79` | `text-2xl` |
| `src/pages/settings-profile/ui/AvatarPicker.tsx:30` | `text-3xl` |
| `src/widgets/deck-tree/ui/folder-row.tsx:51` | `text-xl` |
| `src/widgets/deck-tree/ui/deck-row.tsx:40` | `text-base` / `text-[0.9rem]` |
| `src/widgets/deck-tree/ui/MoveSheet.tsx:131,205` | `text-[0.85rem]`, `text-[0.95rem]` |
| `src/widgets/study-session/ui/faces/TypeWords.tsx:54` | `text-base` |
| `src/widgets/study-session/ui/faces/TypeInitials.tsx:35` | `text-base` |

Two of these bypass a token that exists exactly:
`src/shared/ui/NotificationBell.tsx:18` `text-[10px]` **is** `text-tiny`;
`src/shared/ui/BadgeMedallion.tsx:69` `text-[12px]` **is** `text-label`.
Other raw sizes with no token: `StatTile.tsx:26` `text-[28px]`, `StreakPage.tsx:108` `text-[22px]`,
`:51` `text-[64px]`, `PasswordRow.tsx:19` `text-[18px]`, `TypeInitials.tsx:87` `text-[26px]`.

### 2.3 · inconsistent · viewport units where the app is anchored to `--app-height`
ADR 0002: every number derives from `--app-height`, never from a live viewport.
`src/pages/profile/ui/ProfilePage.tsx:77` `min-h-[calc(100dvh-20rem)]` — `dvh` tracks the URL bar in a
browser tab, so the column's min-height changes as the page scrolls.
Also `src/shared/ui/primitives/drawer.tsx:55` `max-h-[88dvh]`,
`src/widgets/dev-probe/ui/ProbeOverlay.tsx:36` `max-h-[70svh]`,
`src/widgets/content-editor/ui/CardBrowser.tsx:128` `h-[clamp(340px,62vh,560px)]`.

### 2.4 · inconsistent · `outline-none` with no replacement indicator
Tailwind v4 changed `outline-none` from v3's transparent ring to `outline-style: none`, and the
utilities layer beats the `:focus-visible` rule in `theme.css:176`. Sites that add `outline-none`
**without** a `focus-visible:ring-*`: `Combobox.tsx:86,100`, `dropdown-menu.tsx:55,71,127`,
`alert-dialog.tsx:39`, `drawer.tsx:55`, `CardBrowser.tsx:89`, `EditableTitle.tsx:81`,
`EmojiField.tsx:55`. Popup containers and `data-highlighted` menu items are defensible; they are
listed so the set is known. (`EmojiField` is covered by a `focus-within:ring-2` on its wrapper,
`EditableTitle` by an always-on `ring-2` — neither is a hole.)
The 15 `focus-visible:outline-none focus-visible:ring-*` sites are **safe**: the pseudo-class raises
specificity above `.shadow-rest`/`.shadow-interactive`, so the box-shadow ring is not clobbered
(verified against the built CSS: `.shadow-rest` @98449, `.ring-2` @69070, but `focus-visible:` wins on
specificity).

### 2.5 · dead · `src/shared/ui/primitives/drawer.tsx:60`
`'' + 'data-starting-style:transform-(--closed-transform)'` — a no-op string concatenation inside a
`cn()` argument list. Same shape at `src/shared/ui/primitives/field.tsx:27`.

### 2.6 — checked, clean
No v3-only utilities (`flex-shrink-0`, `bg-opacity-*`, `bg-gradient-to-*`, `overflow-ellipsis`) anywhere.
No dynamically built class names — every variant is a lookup map of complete strings (§4).

---

## Pass 3 — Stacking + insets

### 3.1 · broken · `index.html:66-67` disables pinch-zoom for installed users
```js
if (installed) meta.content = '… maximum-scale=1.0, user-scalable=no, …'
```
This is the exact thing `src/styles/tokens.css:39-44` says was removed ("the app used to buy immunity
with `user-scalable=no` and lose pinch-zoom for everyone… sizing the fields is what lets the viewport
meta stay zoomable") and that CODE_STYLE §11 says cannot be relied on ("WebKit ignores
`user-scalable=no`"). So it is inert on the one platform it was written for and **honoured on
Android/Chrome installs**, which is where it does damage.
Trigger: installed PWA on Android, pinch anywhere.
Wrong outcome: zoom refused — WCAG 2.2 §1.4.4. Smallest fix: drop the `maximum-scale`/`user-scalable`
pair, keep `viewport-fit=cover` + `interactive-widget=resizes-visual`.

### 3.2 · broken · the FAB overlaps the last row on a home-indicator iPhone
`SpeedDial` `above-safe-area` sits at `max(0.75rem, safe) + 0.75rem` and its button is `size-14`, so
its top edge is `34 + 12 + 56 = 102 px` above the bottom on an iPhone with a 34 px indicator.
Two screens reserve **96 px** for it by hand instead of using the frame:
- `src/pages/deck-questions/ui/DeckQuestionsPage.tsx:98` — `pb-24`, dial at `:159`
- `src/pages/deck-detail/ui/DeckDetailPage.tsx:121` — `pb-24`, dial at
  `src/widgets/content-editor/ui/DeckContentEditor.tsx:307`

`AppScreen`'s own `GUTTER` comment (`AppScreen.tsx:40-48`) says padding at the end of a scrolling flex
column is what WebKit drops — which is precisely what the scroller's trailing `pb-safe` is. The
reliable reserve is the 96 px in content, and it is 6 px short.
The reference screen does it right: `DeckLibraryPage.tsx:192` uses `gutter="dial"`
(`--app-bottom-inset + 8.5rem` = 170 px).
Same two screens under-reserve for `SelectToolbarDock` in select mode: dock height ≈ `pt-2` 8 +
toolbar ~70 + `--app-bottom-inset + 0.75rem` 46 ≈ **124 px** against the same 96 px.
Smallest fix: `gutter="dial"` on both, delete the `pb-24`.

### 3.3 · risky · `SpeedDial` is bottom-anchored chrome that never yields to the keyboard
`src/shared/ui/SpeedDial.tsx:75` — `fixed … bottom-…`, with no `in-data-keyboard:hidden`.
`AppNav.tsx:52-54` carries that class with a comment explaining why ("WebKit re-clamps
bottom-anchored fixed boxes to the visual viewport when the keyboard shows"), and `AppScreen`'s
`FOOTER_DOCK` carries `[[data-keyboard]_&]:static` for the same reason. `SelectToolbarDock.tsx:13`
(`fixed inset-x-0 bottom-0`) is in the same position.
No shipped screen currently focuses a field while either is mounted, so nothing is wrong today — but
CODE_STYLE §11's rule ("Bottom-anchored chrome yields to the keyboard rather than floating above it")
is enforced on two of four surfaces. Smallest fix: add the variant to both.

### 3.4 · inconsistent · two idioms for the same keyboard gate
`AppNav.tsx:54` uses `in-data-keyboard:hidden`; `AppScreen.tsx:34` uses
`[[data-keyboard]_&]:static`. Same selector, two spellings.

### 3.5 · inconsistent · four spellings of the bottom safe inset
`--app-bottom-inset` (`FooterBar.tsx:10`, `SelectToolbarDock.tsx:16`, `AppScreen.tsx:57-58`,
`SpeedDial.tsx:20`) · `pb-[max(1rem,env(safe-area-inset-bottom))]` (`CardBrowser.tsx:170`) ·
`pb-[max(0.875rem,env(…))]` (`StudySessionFooterShell.tsx:10`) · `pb-[max(0.75rem,env(…))]`
(`faces/CardFace.tsx:131`). Three different minimums for one slot.

### 3.6 — checked, clean
**Nothing moves the header when the keyboard opens.** `--kb-inset` has exactly two consumers
(`.pb-safe`, `.pb-keyboard` in `theme.css:290-296`) plus `visibleBottom()`; no `translate`, no
`--vv-top`, no pan compensation survives anywhere in `src/`. `keyboard-viewport.ts` subscribes to
`resize` only. `env(safe-area-inset-top)` is not double-counted: the status cap (`RootLayout.tsx:34`)
paints the band, `Header`'s `pt-safe` pushes content below it. ADR 0002's acceptance test holds.
z-ladder is monotone and every rung is used in the right order:
`raised 10 < header 20 < nav 200 < dial-scrim 210 < dial 220 < dock 230 < sheet-backdrop 300 <
sheet 310 < dialog-backdrop 400 < dialog 500 < toast 600 < splash 700 < status-cap 800 < dev-probe 900`.

---

## Pass 4 — Screen frame (37 pages; outliers only)

Conforming majority: 30 pages use `AppScreen` + `ScreenHeader`/`SelectHeader`. Outliers:

### 4.1 · inconsistent · six spellings of the bottom gutter
| Spelling | Pages |
| --- | --- |
| `gutter="nav"` (frame) | deck-settings, profile, archived-decks, deck-tts ×2, deck-algorithm ×2 |
| `gutter="dial"` (frame) | deck-library |
| `pb-gutter` (7rem) | settings-change-password `:74`, settings-profile `:52` |
| `pb-28` on the scroller — **inert, see 2.1** | achievements `:41`, badges `:18`, badge-detail `:44`, achievement-detail `:37`, streak `:31` |
| `pb-28` on an inner div (7rem) | settings `:123`, settings-help `:27`, settings-privacy `:69`, settings-about `:27`, notifications `:77` |
| `pb-24` (6rem) | deck-questions `:98`, deck-detail `:121`, settings-swipe `:75`, settings-select `:79` |
| `pb-32` (8rem) | dev-preview `:505` |

`pb-gutter` (`theme.css:303`) and `pb-28` are the same 7rem under two names. None of the hand-rolled
values include `env(safe-area-inset-bottom)`, which is what `GUTTER` exists to fold in.

### 4.2 · inconsistent · `src/pages/forgot-password/ui/ForgotPasswordPage.tsx:77`
A hand-rolled `<header>`. CODE_STYLE §4a: "No screen hand-rolls a `<header>`." It is a content heading,
not chrome, and it carries no `data-slot="header"` so `CHROME.header` still resolves correctly — but
it is the one raw `<header>` in `src/pages` and reads as an exception nobody wrote down.
(`AuthForm.tsx:71` uses `motion.header` for the same job — so even the exception has two forms.)

### 4.3 · inconsistent · `src/pages/deck-questions`, `deck-detail`, `settings-*` mix scroller and content padding
`AppScreen` already applies `pb-safe`/`pb-keyboard` to the scroller. Adding a second bottom padding on
an inner div means two answers to "how much room is at the end" on the same screen — the version that
wins depends on which element it lands on (see 2.1).

### 4.4 — checked, clean
`AuthScreen` is never nested inside itself (`AuthForm` renders it; `LoginPage`/`SignupPage` render
`AuthForm`, not a second `AuthScreen`). `HeaderBar`'s `h-16` is never overridden by a composition —
`SelectHeader.tsx:23` overrides padding/display only, so a list does not jump when select mode opens.

---

## Pass 5 — Event bus

**Clean.** `src/shared/lib/events.ts` declares three events; all three are published
(`widgets/study-session-reward/use-study-session-reward.ts:25,26,28`) and all three are subscribed
(`app/providers/NotificationBridge.tsx:12,15,18`). Subscriptions are made in `useEffect` and every
handle is released in the cleanup (`NotificationBridge.tsx:22-24`). No emit happens during render —
both emitters are inside an async `useCallback` invoked from a handler.

One thing to know rather than fix: `NotificationBridge` records the notification unconditionally while
the toast is gated on `preferences.notifications`. The copy is precise about this
(`en.ts:1043` — "Show milestone **toasts**"), so it is deliberate.

---

## Pass 6 — Wiring

### 6.1 · risky · `src/entities/progress/model/store.ts:10`
The only mirroring singleton created **without** a `complete` function
(`preferences` passes `completePreferences`, `profile` passes `completeProfile`).
`shared/lib/entity-store.ts:80-84` states the rule: "a document that arrives over replication was
written by whichever build the other device runs and is stored at the current version untouched. So
the entity — not the screen reading it — decides what a missing field means, once, on the way in."
Every reader compensates instead: `StreakPage.tsx:20-22` (`?? 0`, `?? []`),
`use-rewards.ts:50-54`, `use-home-header-data.ts:34`. `shared/lib/merge-progress.ts:57`
does **not**: `[...local.trainingDays, ...remote.trainingDays]` throws on a document without the field,
inside the replication conflict handler.
Smallest fix: `createSingletonStore('progress', repo, completeProgress)` — `makeProgress` already
defaults every field.

### 6.2 · dead · ten barrel exports nothing outside their slice imports
`features/data` → `clearAllContent`, `resetProgress`; `features/deck` → `requireDeck`;
`features/preferences` → `PREFERENCES_ID`; `features/profile` → `PROFILE_ID`;
`features/progress` → `currentProgress`; `features/review` → `reinsertAhead`, `REINSERT_AHEAD`;
`features/session` → `signUpWithEmail`, `signInWithEmail`.
All are used through deep intra-slice imports or tests; the barrel line is public API nothing consumes.

### 6.3 — checked, clean
`composition-root.ts:110-121` calls `start()` on all eight mirroring stores; `session` is deliberately
absent and `AuthProvider` restores it. **Every write in `src/` goes through `features/**`** — the only
`getState().save(` / `.remove(` outside `features/` is `shared/lib/collection-commands.ts`, which is
the shared command factory. No deep cross-slice import dodges a barrel (`eslint-plugin-boundaries`
passes).

### 6.4 · broken · screens reading a store without gating on `selectIsReady`
Gated correctly: deck-library, deck-detail, deck-questions, study, quiz, match, archived-decks,
achievements/badges/profile (via `useRewards`), settings-profile, and everything using `useDeck()`.
**Not gated:**

| Screen | Reads | Wrong outcome on a cold start / hard reload |
| --- | --- | --- |
| `src/pages/streak/ui/StreakPage.tsx:17` | `selectProgress` | `0` and "Start today" render before the snapshot lands — a 40-day streak shows as 0, then flips |
| `src/pages/notifications/ui/NotificationsPage.tsx:25` | `selectNotifications` | the "No notifications yet" empty state flashes, and the header's overflow menu appears a beat later (`:65`) |
| `src/pages/settings/ui/SettingsPage.tsx`, `settings-privacy:20`, `settings-select`, `settings-swipe` | `selectEffectivePreferences` | that selector answers `DEFAULT_PREFERENCES` while `status !== 'ready'`, so every switch paints its **default** first — a learner with Haptics off sees it on, then off |
| `src/pages/card-editor`, `question-editor`, `import-review` | card/question stores | no loading state at all |

Smallest fix: the same `!ready → <ScreenLoading/>` / skeleton gate the other 10 screens use.

---

## Pass 7 — Screen states

`loading` / `error` / `empty` are broadly covered. The gap is **offline**, which has exactly one
consumer in the whole app: `useOnline()` at `src/widgets/threshold/ui/AuthForm.tsx:43`, and only for
the social-sign-in row (`:97`).

### 7.1 · broken · `src/shared/lib/auth-error-copy.ts:4-19` has no network case
`COPY` maps eleven provider codes. A fetch failure carries no code, so
`SupabaseAuthGateway.fail()` wraps it as `AuthError(message, 'unknown')`, `authErrorKey` returns
`null`, and `authErrorMessage` (`:40`) falls through to `error.message`.
Trigger: airplane mode, `/login` → "Sign in".
Wrong outcome: a toast reading the raw transport message (`Failed to fetch` /
`Network request failed`), while `auth.errors.offline` ("You're offline — reconnect…") sits in
`en.ts` used only by the social buttons.
Affects `/login`, `/signup`, `/forgot`, `/settings/change-password`, `/auth/callback`.

### 7.2 · broken · offline state missing entirely
| Route | Network act | Offline state |
| --- | --- | --- |
| `/forgot` (`ForgotPasswordPage.tsx:43-52`) | `requestPasswordReset` | none — no `useOnline`, submit stays enabled |
| `/settings/change-password` (`:38-57`) | `setPassword` | none |
| `/settings/profile` (`use-profile-form.ts`) | avatar upload to Supabase Storage | none |
| `/settings/profile` (`use-delete-account.ts`) | account deletion | none |
| `/auth/callback` (`:39`) | `completeAuthRedirect` | catch → generic `callbackFailed` |

Smallest fix: the surfaces that need the network already have the pattern —
`SocialButtons`' `unavailableReason` prop.

### 7.3 — checked, clean
Every route wires `onBack` (`app/routes/*-screens.tsx`), so the optional `onBack?` props never leave a
screen without an exit. `MissingScreen` covers the id-is-gone case on badge-detail, achievement-detail,
quiz, study, match; deck screens use `useDeck().ready` + a not-found header.

---

## Pass 8 — i18n

### 8.1 — no missing keys
Every `t('…')` in `src/` resolves. The 26 apparent misses are all plural stems
(`archived.cardCount` → `_one`/`_other`, `deck.dueToday`, `folder.deckCount`, `cards.paste.*`,
`cards.review.*`) or my regex catching non-i18n `key:` object fields.

### 8.2 — no hardcoded user-facing strings
Three literals in shipped JSX, all legitimate: `SettingsAboutPage.tsx:39` "Mindscape" (brand) and two
in `dev-preview` (the dev-only kitchen sink).

### 8.3 · dead · 122 keys defined and never referenced
After excluding every dynamically built key (`srs.*`, `badges.<id>.blurb`,
`settings.help.categories.*`, `cardStyle.preset|fontName.*`, `swipe.types|sample.*`,
`achievementDetail.*`, `achievements.<id>.*`, `select.surfaces.*`, `home.greeting*`,
`<subject>.nameLabel|namePlaceholder|iconLabel`, `study.filter*`, `notifications.<bucket>`) and all
plural suffixes, 122 remain. Full list in the appendix; the clusters that mean something:

- **`settings.clearScreen.*` — 22 keys.** A whole "Clear data" screen (decks / stats / notifications /
  all, with counts, a two-step confirmation and a warning) exists in copy. The commands exist too
  (`features/data/clear-content.ts`, `reset-progress.ts`). **There is no screen and no route.**
- **`cards.searchCards`, `cards.searchQuestions`, `cards.tabs.*`** — see 10.1.
- **`progress.heading|streakHeading|calendar|daysTrained|bestQuiz`, `streak.reviewDue`** — the copy for
  the dead `StreakSummary` widget (10.2).
- **`profile.*` — 20 keys** (`journey`, `overview`, `statistics`, `viewFullStats`, `progressTitle`,
  `badgesTitle`, `tiles.longestStreak|daysTrained|bestAccuracy`, `comingSoon`, …) from an earlier
  profile layout.
- **`settings.profileEdit.logout*` — 4 keys** including a logout confirmation dialog.
- **`study.*` — 14 keys** (`skip`, `undo`, `flag`, `flagged`, `listen`, `startOver`, `edit`,
  `recallComplete`, `modeSettings`, `swipeActionsTitle`, `cardsToStudy`, `general`).
- **`settings.email|phone|notSet|signedInAs|comingSoon|openLabel`**, `nav.decks`,
  `auth.login.rememberMe`, `auth.guestNote`, `auth.splash.enter`, `move.title|none|current`,
  `deck.archive|duplicate|move|addCard|addDeck|addSubdeck|subdecks|rowActions|nestHint|restoredToast|cantMoveIntoSelf|cardsInDeck`.

Smallest fix: delete, or file the screens they belong to.

---

## Pass 9 — Persistence back-compat

**Clean, and unusually careful.** Every bumped version has a strategy
(`database.ts:39-75`: preferences 1, deck 1+2 identity with the reason written down, card 1,
profile 1). Every entity field is in its schema and vice versa. `deck.settings` is
`additionalProperties: false` with no `required`, so `Partial<DeckSettings>` is honoured and a new key
needs no rewrite — matching `DECK_SETTINGS_UI_STATUS.md`'s "Persisted shape" section. Conflict handlers
are declared per collection; `notifications` is deliberately device-local.

The one exposure is **6.1** — `progress` is the singleton without a `complete()`, so a document that
arrives over replication rather than through a local migration is not repaired on the way in.

Historical note, not actionable: `git log` shows the preferences schema going `8 → 0` in `b175e83`
(2026-07-02) and `flashcardSwipe` / `studyWordSpaces` / `shakeToUndo` / `privacy` being added while it
sat at version 0. `completePreferences` (`entities/preferences/model/types.ts:157`) covers every one of
those on read, so nothing is broken today.

---

## Pass 10 — Dead weight

### 10.1 · dead · card search in `DeckContentEditor`
`src/widgets/content-editor/ui/DeckContentEditor.tsx:49-51` declares `searchQuery`, `searching`,
`onClearSearch`. The **sole caller** (`src/pages/deck-detail/ui/DeckDetailPage.tsx:151-161`) passes
none of them. Dead as a result: the filter at `:106`, the `!searching` gates at `:165` and `:171`, the
`NoResults` branch at `:192`, and `NoResults` itself
(`src/widgets/content-editor/ui/CardListStates.tsx:51`). Plus the i18n keys `cards.searchCards`,
`cards.searchQuestions`. Trigger: `/decks/$deckId` — there is no search field on the screen.

### 10.2 · dead · `src/widgets/streak-summary/` (141 lines + a 141-line test)
`StreakSummary` is exported from `widgets/streak-summary/index.ts` and rendered by nothing.
Only its own test imports it. Carries the six dead `progress.*` keys.

### 10.3 · dead · `hideIcon` on `DeckCover`
`src/shared/ui/DeckCover.tsx:11,21,31,51,72` — declared, defaulted, branched on three times, and
never passed `true` by any caller.

### 10.4 · dead · `src/shared/ui/EmojiField.tsx:27,48`
`const ref = useRef<HTMLInputElement>(null)` is attached to the input and never read.

### 10.5 — checked, clean
No `console.*`, no commented-out code blocks, no `TODO`/`FIXME`/`HACK` anywhere in `src/`. Every route
in `router.tsx` is reachable; every component in `shared/ui`, `widgets` and `pages` is referenced
except 10.2. `/dev/kitchen-sink` ships in production **on purpose** (ADR 0002, `NEW_ARCHITECHTURE.md`
T11.G) and is correctly the one lazily split route with its own chunk.

---

## Beyond the ten passes

### A · risky · "Current password" is collected and never checked
`src/pages/settings-change-password/ui/SettingsChangePasswordPage.tsx:79-86` renders a
`current-password` field; `:36` gates the submit on it being non-empty; `:44` calls
`setPassword(next)`. `src/features/session/set-password.ts:9` is `gateway.updatePassword(password)` —
the old password is never sent anywhere.
Trigger: `/settings/change-password` (non-recovery), type any character in "Current password".
Wrong outcome: the password changes without the current one being verified. The field reads as a
security check and is a decoration. The recovery path's comment explains why *it* needs no current
password; the non-recovery path inherited that behaviour with the field still on screen.

### B · risky · `/settings/privacy` ships five controls that nothing honours
`src/pages/settings-privacy/ui/SettingsPrivacyPage.tsx:25-56` — Profile visibility, Activity sharing,
Location access, Notification insights, **Data encryption**. `grep -rn "prefs.privacy"` finds one
writer and no reader. `DEFAULT_PRIVACY` (`entities/preferences/model/types.ts:40-46`) ships
`dataEncryption: true`, so the row reads **"Data encryption — Encrypt your saved data at rest"**
already switched on, over an unencrypted Dexie/IndexedDB store.
The banner (`:72-76`) does disclose "These controls take effect as the features that use them ship" —
but a toggle rendered *on* is a stronger claim than the banner's hedge. This is the
`DECK_SETTINGS_UI_STATUS.md` "UI only"/"Invented" distinction applied to a screen that doc does not
cover. Smallest fix: default `dataEncryption` to `false`, or mark the rows disabled/"coming soon".

### C · dead · `soundEffects` preference
`src/pages/settings/ui/SettingsPage.tsx:167-174` writes it; nothing reads it.
`grep -rniE "new Audio|AudioContext|\.mp3|\.wav|playSound"` over `src/` → nothing. The copy is
specific: "Play short tones on answers and session completion" (`en.ts:1035`).
Trigger: `/settings`, toggle "Sound effects". Wrong outcome: nothing happens, ever.

### D · inconsistent · `motion` animating `width`
CODE_STYLE §9: "animate `transform`/`opacity` only; layout props reflow and drop frames", and
`Header.tsx:170-174` spells out the reason for using `scaleX` instead.
`src/shared/ui/primitives/progress.tsx:39-40` and `src/widgets/quiz/ui/QuizPanel.tsx:112` both animate
`width`. Trigger: `/profile`, `/badges`, `/achievements` (every `<Progress>`), `/decks/$id/quiz` (bar
moves on every answer).

### E · inconsistent · UBIQUITOUS_LANGUAGE violations
"A palace is never an entity" —
`src/widgets/profile-header/ui/ProfileHero.tsx:14,26,102` prop `palaceCount`, fed by
`topLevelDecks.length` (`src/pages/profile/ui/ProfilePage.tsx:71`) and labelled `profile.tiles.decks`.
`src/widgets/threshold/ui/Threshold.tsx:29` — interface `PalaceThresholdProps` for a component named
`Threshold`.
"room" is brand, not model — `src/pages/achievements/ui/AchievementsPage.tsx:31` `id: 'rooms'` for a
tile whose value is `totals.decksCompleted`.

### F · broken (deploy) · SPA fallback still missing
CODE_STYLE §8 says it is mandatory and currently missing. Still true: no `public/_redirects`, no
`vercel.json`, no `netlify.toml`. Deep-linking `/decks/123` or a page reload anywhere but `/` 404s on a
static host.

### G · risky (perf) · 1.47 MB of JS is fetched before first paint
`dist/index.html` module-preloads `ui-*.js` (576 kB) alongside the entry `index-*.js` (897 kB) —
≈461 kB gzipped before the splash lifts. The entry chunk carries RxDB + Dexie + Supabase because
`app/composition-root.ts:126` builds the database as a module-level singleton that `router.tsx`
imports statically. Route splitting is working (six screen chunks + kitchen-sink); the shell is not.

### H · doc is wrong · CODE_STYLE §7 describes the opposite of the shipped router
> "`app/router.tsx` has **36 routes and splits exactly one**, `/dev/kitchen-sink`; the other 35 land in
> the entry chunk via `app/routes/*-screens.tsx`."

`e39a92c` ("perf(router): split routes so the entry chunk stops carrying every screen") made all six
`routes/*-screens` modules lazy via `lazyScreen()`, and the build confirms six separate chunks. The
paragraph now reads as an instruction to undo that.

### I · inconsistent (a11y) · `SpeedDial` announces a menu it does not build
`src/shared/ui/SpeedDial.tsx:120-121` sets `aria-haspopup="menu"` and `aria-expanded`, but the popup
(`:82-112`) is a plain `<ul>` of `<button>`s with no `role="menu"`/`role="menuitem"`. A screen reader
is told a menu opened and lands on list items.
Also `:67` — clicking the scrim closes the dial without returning focus to the trigger (Escape at
`:44` does). Focus falls to `<body>`.

### J · inconsistent (a11y) · tap targets under 44 px
`src/pages/login/ui/LoginPage.tsx:70` "Forgot password?" — `text-label` (12 px) with no padding and no
`min-h`. `AuthSwitchLink` in the same tree is the same shape. MOBILE_DESIGN's 44 px minimum is met
everywhere else (the 44px floor is met by `IconButton` at `md` (`icon-button.tsx:20`, `size-11`) and by ~29 `h-11`/`size-11`/`min-h-11` sites, including `ForgotPasswordPage.tsx:65`).

### K · inconsistent · one inline colour style where a class exists
`src/pages/streak/ui/StreakPage.tsx:39` `style={{ background: 'var(--warning-surface)' }}` — CODE_STYLE
§5's sanctioned form for an unaliased role is `bg-(--warning-surface)`, used everywhere else
(`SelectToolbar.tsx:57`, `ActionSheet.tsx:25,29`, `TypeWords.tsx:124`, …).

---

## Unverified suspicions

Trigger identified but not reproduced on a device; each needs `/dev/kitchen-sink` or an iPhone.

1. **`useVirtualKeyboard().open` is derived from the wrong number.**
   `src/shared/lib/use-virtual-keyboard.ts:11` — `open: height > 0`, where `height` is `keyboardHeight()`
   = `--kb-inset`, the *pan-reduced* coverage. ADR 0002 and CODE_STYLE §11 both insist "is a keyboard up"
   and "how much does it cover" are two numbers, and the module keeps them apart internally
   (`publishedOpen` vs `published`, `keyboard-viewport.ts:53-64`). When the pan equals the keyboard's
   height — the focused field sitting at the very bottom — `--kb-inset` is 0 and `open` reads false.
   Sole consumer: `src/widgets/study-session/ui/faces/TypeWords.tsx:35` (`floats`), so the feedback band
   would render inline instead of floating clear. Verify: study session, `type` mode, answer field at the
   bottom of the screen, check the probe's `--kb-inset` / `data-keyboard` pair.

2. **`SelectToolbarDock` may sit 4 rem too high for one frame on entering select mode.**
   `DeckLibraryPage.tsx:100` suppresses the nav in a `useEffect`; `AppNav.tsx:32-42` removes the
   `--app-bottom-inset` override in a `useLayoutEffect` on the *next* render. The dock
   (`SelectToolbarDock.tsx:16`) reads the token in the render before that. Verify: slow-motion capture of a
   press-and-hold on `/`.

3. **`--app-height` fallback of `100%` under `--preview-pane-height`.**
   `theme.css:101` — `clamp(190px, calc(var(--app-height) * 0.34), 340px)` resolves against a percentage
   until `startKeyboardViewport` publishes a px value. `useKeyboardInset` is a `useLayoutEffect`
   specifically to close that window, but the card-style preview is the one box sized as a share of the
   shell. Verify: cold load `/decks/$id/settings/card-style` with CPU throttling.

---

## Appendix — the 122 dead i18n keys

```
auth.guestNote · auth.login.rememberMe · auth.splash.enter · badges.subtitle · cardStyle.preview
cards.bulk.flag · cards.bulk.known · cards.bulk.reset · cards.editor.added · cards.editor.updated
cards.quickBack · cards.quickFront · cards.review.editCard · cards.row.duplicate · cards.row.markKnown
cards.row.resetSchedule · cards.searchCards · cards.searchQuestions · cards.tabs.cards · cards.tabs.label
cards.tabs.questions · common.guest · common.options · common.tagline · deck.addCard · deck.addDeck
deck.addSubdeck · deck.archive · deck.cantMoveIntoSelf · deck.cardsInDeck · deck.duplicate · deck.move
deck.nestHint · deck.restoredToast · deck.rowActions · deck.subdecks · folder.settings · match.open
match.openLabel · move.current · move.none · move.title · nav.decks · notifications.clearAllLabel
profile.achievements · profile.badgeCount · profile.badgesTitle · profile.comingSoon · profile.journey
profile.levelShort · profile.overview · profile.progressHint · profile.progressTitle · profile.settingsHint
profile.settingsTitle · profile.statistics · profile.tiles.bestAccuracy · profile.tiles.daysTrained
profile.tiles.longestStreak · profile.viewFullStats · profile.viewFullStatsHint · progress.bestQuiz
progress.calendar · progress.daysTrained · progress.heading · progress.streakHeading · quiz.restart
quiz.streakOne · quiz.timeLeft · select.preview · select.resetToast · settings.clearScreen.all
settings.clearScreen.allHint · settings.clearScreen.cancel · settings.clearScreen.confirm
settings.clearScreen.confirmBody · settings.clearScreen.confirmTitle · settings.clearScreen.confirmTitleAll
settings.clearScreen.decks · settings.clearScreen.decksCountOne · settings.clearScreen.decksCountOther
settings.clearScreen.decksHint · settings.clearScreen.done · settings.clearScreen.notifications
settings.clearScreen.notificationsCountOne · settings.clearScreen.notificationsCountOther
settings.clearScreen.notificationsHint · settings.clearScreen.stats · settings.clearScreen.statsCountOne
settings.clearScreen.statsCountOther · settings.clearScreen.statsHint · settings.clearScreen.title
settings.clearScreen.warningBody · settings.clearScreen.warningTitle · settings.comingSoon · settings.email
settings.guestCtaAction · settings.notSet · settings.openLabel · settings.phone
settings.profileEdit.logout · settings.profileEdit.logoutConfirmBody · settings.profileEdit.logoutConfirmCta
settings.profileEdit.logoutConfirmTitle · settings.profileEdit.securitySection · settings.signedInAs
streak.reviewDue · study.cardsToStudy · study.edit · study.flag · study.flagged · study.general
study.listen · study.modeSettings · study.recallComplete · study.skip · study.startOver
study.swipeActionsTitle · study.undo · swipe.none · swipe.preview · swipe.resetToast
```

---

# Resolution — 2026-09-06

Implemented on `main`. Baseline after: `typecheck` pass · `lint` pass · `test` **1270 passed / 8 skipped
(250 files)** · `build` pass.

Four calls were the user's, not the audit's: verify the current password by re-authenticating (A);
mark the unhonoured controls unbuilt rather than delete them (B, C); wire the dead card search up as
a feature rather than remove it (10.1); and resolve the duplicate 14px token by collapsing it.

## Fixed

| # | What changed |
| --- | --- |
| 1.1 | `cn()` is `extendTailwindMerge` told the app's theme — type, radius and elevation names. `cn.test.ts` is that list as behaviour. 64 call sites stop losing a class. |
| 1.2 | `--shadow-rest/-featured/-interactive/-elevated` get a `[data-theme='dark']` block in black, keeping each role's geometry. 91 call sites stop rendering flat. |
| 1.3 | `--p-text-sub` deleted; 63 sites take `text-body`. `deck-row`'s `isSub ? 'text-sub' : 'text-body'` asked for a step between two identical numbers — indent and cover size carry it instead. |
| 1.4 | `--radius-pill` deleted; 11 `rounded-pill` sites take `rounded-full`. |
| 1.5 / 3.5 | New primitive `--p-safe-bottom`. `--app-bottom-inset`, `AppNav` (both spellings), `SpeedDial`, `CardBrowser`, `CardFace`, `StudySessionFooterShell` all derive from it — four spellings and three different minimums become one number. |
| 1.6 | Dead `dataset.display = 'installed'` removed with the block that set it. |
| 2.1 / 4.1 / 4.3 | New `gutter="end"` on `AppScreen`. Ten screens' `pb-24`/`pb-28`/`pb-32`/`pb-gutter` and five inert scroller `pb-28`s all become the frame's gutter, which folds in the home indicator. `.pb-gutter` deleted. |
| 2.2 | Three scales named for what they are: `text-glyph-*` (an emoji filling a square), `text-figure-*` (a display figure), `text-card-*` (the printed card's fluid ramp). Every off-scale size mapped; `text-[10px]`→`text-tiny`, `text-[12px]`→`text-label`, the two study fields → `text-entry`. No raw sizes left in `src`. |
| 2.3 | `100dvh`/`88dvh`/`70svh`/`62vh` → `var(--app-height)`. No viewport units left in `src`. |
| 2.5 | Six `'' + '…'` no-ops removed (audit found two). |
| 3.1 | `maximum-scale=1.0, user-scalable=no` dropped — inert on WebKit, honoured on Android installs, WCAG 2.2 §1.4.4. |
| 3.2 | `gutter="dial"` on deck-detail and deck-questions; the hand-rolled `pb-24` that was 6px short of the dial and 28px short of the select dock is gone. |
| 3.3 | `SpeedDial` (and its scrim) and `SelectToolbarDock` yield to the keyboard, as `AppNav` and the footer dock already did. |
| 3.4 | `[[data-keyboard]_&]:static` → `in-data-keyboard:static`. One spelling. |
| 4.2 | `AuthHeader` owns its `<header>` and its column. The raw `<header>` in `src/pages` is gone, `AuthForm`'s `motion.header` with it — and signup's confirm screen stops drawing the logo *and* the mail check, which `mark` exists to prevent. |
| 6.1 | `completeProgress` added and wired into the singleton store. Tested against a document missing `trainingDays` — the field `mergeProgress` spreads unguarded inside the conflict handler. |
| 6.2 | Ten barrel lines removed (each verified unreferenced outside its slice). Implementations stay; one test now imports its module directly. |
| 6.4 | `selectIsReady` gates on streak, notifications, settings, settings-privacy, settings-select, settings-swipe, card-editor, question-editor. |
| 7.1 | `SupabaseAuthGateway.fail()` labels a transport failure `network` via `isAuthRetryableFetchError`; `auth.errors.network` is the copy. No more "Failed to fetch" in a toast. |
| 7.2 | New `OfflineNotice`. `/forgot` and `/settings/change-password` disable submit and say why before the press; `/auth/callback` distinguishes a dead network from an expired link. |
| 8.3 | 107 unreferenced keys deleted, computed here rather than taken from the list — dynamic families detected from actual interpolation sites in source (`study.filter${…}` is live and the audit's exclusion list was right about it). |
| 10.1 | **Built, not deleted.** Search button in the deck header beside Settings; `SearchField` in `shared/ui`; the filter, the `!searching` gates and `NoResults` are all reachable, with a test. |
| 10.2 | `StreakSummary` deleted — `StreakPage` already shows all four of its parts (`StreakCalendar` is a month where it drew a week), and XP/level live on `ProfileHero` and `HomeHeader`. `buildDayCells` went with it as its last consumer. |
| 10.3 / 10.4 | `hideIcon` and the unread `EmojiField` ref removed. |
| A | `setPassword` re-authenticates with the current password before writing the new one; wrong password gets its own code and copy, a rate limit or dead network keeps its own. Recovery path challenges nothing. |
| B / C | The five privacy rows and Sound effects become `kind="soon"` — the app's own vocabulary, previously used by nothing. `DEFAULT_PRIVACY.dataEncryption` now defaults **false**. |
| D | `Progress`, `QuizPanel` and the card-editor bar animate `scaleX`, not `width` (the last two the audit did not list). |
| E | `palaceCount`→`deckCount`, `PalaceThresholdProps`→`ThresholdProps`, achievement tile `'rooms'`→`'decks'`. |
| F | `vercel.json` (rewrite + the cache headers §8 requires) and `public/_redirects`. |
| H | CODE_STYLE §7 and §8 rewritten to describe the shipped router and the now-present fallback. §5 gained the `cn()` rule, the type/glyph/figure/card scales and the `rounded-full` decision; the `outline-none` exceptions from 2.4 are written down. |
| I | The dial's popup is a real `role="menu"` of `menuitem`s, and every way of closing it returns focus to the trigger — the scrim did not. |
| J | "Forgot password?" and `AuthSwitchLink` reach the 44px floor without moving their text. |
| K | `bg-(--warning-surface)`, not an inline style. |
| Suspicion 1 | **Confirmed and fixed.** `keyboardOpen()` exported; `useVirtualKeyboard().open` reads it instead of `height > 0`. Test covers the pan-equals-keyboard case where the inset is 0 with a keyboard on screen. |

## Checked, and the audit was wrong

- **6.4 · `import-review`** reads only its own local draft store (`useImportDraft`) and two `…StoreApi`
  handles. No subscribed entity read, so no readiness gap. Not gated.
- **7.2 · `/settings/profile` avatar upload** already handles offline, deliberately:
  `uploadInlineImage` never throws and the profile keeps the inline copy until
  `reconcileInlineImages` moves it. Adding a gate would break an offline-first feature.
- **7.2 · account deletion** (`use-delete-account`) is entirely local — it resets stores and clears
  the profile, and touches no gateway. Nothing to make offline-aware.
- **D · `CardMaturityOverview`** keeps `width`, with the reason written down: its segments are flex
  siblings whose widths sum to 100%, so a transform leaves them overlapping. It changes only when
  the deck's counts do, off the interaction path.

## Not done

- **G · first-paint bytes.** The heavy dependencies now sit in their own chunks (`persistence`
  294 kB, `supabase` 209 kB, `react` 190 kB) so an app-code deploy no longer invalidates them in the
  precache — a real win, but a caching one. The total before first paint is unchanged, because every
  preload in `dist/index.html` is a genuine entry dependency: the app cannot paint without its
  database. Moving RxDB off the critical path means deferring `createServices()` behind the splash
  and making `services` awaited rather than a module-level singleton. That is an architecture change
  and wants to be its own piece of work.
- **Suspicions 2 and 3** need a device. Unchanged.
- **Question search.** `cards.searchQuestions` was deleted with the other dead keys — `/decks/$id/questions`
  has no search. `SearchField` is shared and that screen has the same shape, so it is a small
  follow-on if wanted.
