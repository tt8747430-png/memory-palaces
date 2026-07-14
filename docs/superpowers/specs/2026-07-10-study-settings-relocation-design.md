# Study settings relocation & flashcard surface slim-down

**Date:** 2026-07-10
**Status:** Draft — awaiting review

## Goal

Strip the live study (flashcards) surface down to in-the-moment controls, and relocate
every persistent study setting to a **"Studying" section on the Room settings page**. Make
those settings **global app-wide preferences** (one value for all study) rather than
palace-scoped, so they behave consistently and survive palace-scope study. Introduce a
compact **per-mode swipe editor** (tabs for Blur / Rebuild / Initials / Type) as the way to
map flashcard swipe gestures.

## Non-goals

- No change to the SRS engine, grading, the session machine, or the card modes themselves.
- No redesign of the card faces beyond removing relocated controls.
- No new study-launch/scope-picker flow (scope stays a live in-session filter).

## Current state (what moves)

The live study surface (`widgets/study-session`) currently owns a merged **GearSheet** with
three sections — This card (quick actions), This mode (mode toggle + per-direction swipe
map), Session (scope chips, orientation, shuffle, TTS, shake) — plus a **Finish** button, and
a **long-press** gesture that opens a duplicate `QuickActionsSheet`.

Persistence today:

| Setting | Scope today | Source |
|---|---|---|
| `flashcardSwipe` (per-mode swipe map) | global | `entities/preferences` |
| `shakeToUndo` | global | `entities/preferences` |
| `studyMode`, `studyWordSpaces` | global | `entities/preferences` |
| `shuffleCards`, `textToSpeech`, `studyDirection` (orientation) | **palace** | `palace.settings` |

`Room` has **no** settings field today (`palaceId`, `title`, `description` only).

## Target design

### 1. Preferences model (global)

Add to the global `Preferences` shape (`entities/preferences/model/types.ts`):

- `studyShuffle: boolean` — default `false` (replaces `palace.settings.shuffleCards` for study)
- `studyTextToSpeech: boolean` — default `false` (replaces `palace.settings.textToSpeech`)
- `studyDirection: StudyDirection` (`'front' | 'back'`) — default `'front'` (replaces
  `palace.settings.studyDirection`)

Update `DEFAULT_PREFERENCES`, `PreferencesInput`, `fromInput`, and the `PreferencesChanges`
key union accordingly. `flashcardSwipe`, `shakeToUndo`, `studyMode`, `studyWordSpaces` are
already global and unchanged.

**Migration:** none required. Study simply stops reading the palace fields and reads the new
global prefs (which default sensibly). The palace fields (`shuffleCards`, `textToSpeech`,
`studyDirection`) are **left in place, unused** (Decision D2) to avoid an RxDB schema
migration; they become dead data on the palace settings type.

### 2. Room settings page — new "Studying" section

`pages/room-settings/ui/RoomSettingsPage.tsx` gains a `SettingsSection` titled "Studying",
placed above Manage, containing:

- **Card orientation** — Term / Definition (`studyDirection`), a `SettingsRow kind="picker"`
  or inline segmented control writing global prefs.
- **Shuffle cards** — toggle (`studyShuffle`).
- **Read aloud** — toggle (`studyTextToSpeech`), disabled + "not supported" hint when
  `speechAvailable()` is false.
- **Shake to undo** — toggle (`shakeToUndo`), gated by `motionSupported()`; enabling requests
  device-motion permission (same `requestMotionPermission()` flow as today).
- **Swipe actions** — a `SettingsRow kind="nav"` (or inline disclosure) opening the per-mode
  swipe editor (§3).

A one-line section caption states these apply to all study. Because the values are global,
palace-scope study reads the same settings; a user studying a whole palace can configure them
from any room's settings.

### 3. Per-mode swipe editor (the compact mode-tabs UI)

New widget `widgets/flashcard-swipe-settings` (composes `entities/preferences`,
`shared/config/flashcard-swipe`, `shared/ui`). Rendered inline in the Studying section (or a
dedicated sheet/subscreen — see D3):

- A tab strip: `[Blur] [Rebuild] [Initials] [Type]` (order of `STUDY_MODES`), the active tab
  filled per the app's selection style.
- Selecting a tab swaps the body to that mode's four rows — Up / Down / Left / Right → an
  action `Combobox` whose options are `actionsForMode(tab)` (shared actions + that mode's own
  mechanics). Reads/writes `preferences.flashcardSwipe[tab]` via `setPreferences`.
- Reuses the existing `DIRECTION_META` + `Combobox` row pattern lifted out of the current
  `GearSheet`. One panel, four modes — compact.

This is parallel to, and independent of, the existing list-row swipe screen (`settings-swipe`),
which stays as-is.

### 4. Study surface — what remains

**`StudyDeck.tsx`**
- Remove long-press entirely: delete `onLongPress`, `holdTimer`, `heldRef`, `LONG_PRESS_MS`,
  `LONG_PRESS_SLOP`, and the hold/quick-actions branch in the drag handler. Tap-to-flip and
  swipe-to-commit are unchanged.

**`card-faces.tsx`**
- The footer's right control (`GearButton`) swaps its icon from `SlidersHorizontal` to a
  **real gear** (`Settings` / cog from `lucide-react`). Its `aria-label` stays "Study options"
  or becomes "Card actions" (see i18n §6). `ModeButton` (left) and the centered mode aids are
  unchanged.

**`GearSheet.tsx` → slimmed (rename to `StudySheet.tsx`)**
- Contains only:
  - **This card** — `QuickActionRows` (Undo / Flag / Edit / Listen / Skip / Restart).
  - **This mode** — mode-specific toggles only: Initials → *Show word spaces*
    (`studyWordSpaces`, global), Type → *Initials only* (`typeInitialsOnly`, session state).
  - **Studying** — the live **scope filter** chips (All / Due / New / Learning / Flagged),
    kept as an in-session filter (Decision: keep in study).
- Removed from the sheet: the per-direction swipe map, orientation, shuffle, TTS, shake, and
  the **Finish** footer button. The sheet no longer has a footer.

**`FlashcardsPanel.tsx`**
- Drop `quickOpen`/`QuickActionsSheet` state and render.
- Drop the `finish` dispatch path from the sheet; ending a session is the header back chevron
  or completing the deck. (`sessionReducer`'s `finish` action may remain unused or be removed
  if nothing else dispatches it — confirm in planning.)
- Read `shuffle`, `textToSpeech`, `direction` from **global preferences** (props from the page)
  instead of palace settings; keep passing `wordSpaces`, `shakeToUndo`, `swipeByMode`, `mode`.

**`StudyCardsPage.tsx`**
- Stop deriving `StudyPrefs` from `palace.settings`; source `direction`, `shuffle`,
  `textToSpeech` from `selectEffectivePreferences`.
- Remove `persistStudyPrefs`→palace. Shuffle/TTS/orientation edits now happen on Room settings,
  not in study, so the page no longer persists them. It still persists `studyMode`,
  `studyWordSpaces`, `shakeToUndo`, `flashcardSwipe` via `setPreferences` where those remain
  editable in study (mode switch, word-spaces).
- Header is unchanged (back · title · spacer); no new study→settings button.

### 5. Removed / deleted

- Long-press gesture and `QuickActionsSheet.tsx`.
- The `Finish` button and its i18n usage in study.
- Swipe-map / shuffle / TTS / shake / orientation controls from the study sheet.

### 6. i18n (`shared/i18n/locales/en.ts`)

- New `roomSettings.studying.*` keys: section title, orientation, shuffle, read-aloud,
  shake, swipe-actions nav label, and the "applies to all study" caption.
- New keys for the swipe editor tabs (reuse existing `study.mode*` labels) and reuse
  `study.swipeUp/Down/Left/Right` + `study.swipeActions.*`.
- Retire/relocate `study.finish`; keep `study.swipe*` and `study.swipeActions.*` (now used by
  the editor). Audit for now-unused study keys and remove them.

### 7. Testing

- `FlashcardsPanel.test.tsx`: assert no long-press quick-actions path, no Finish button; the
  gear sheet shows only quick actions + mode toggle + scope.
- New `widgets/flashcard-swipe-settings` test: switching tabs shows the tab's saved map;
  changing a direction persists to `flashcardSwipe[mode]` via the preferences command.
- `RoomSettingsPage` test: Studying section renders; toggles persist to global prefs.
- `entities/preferences` `fromInput`/defaults test: new fields normalize and default.
- Update `StudyCardsPage` wiring expectations (reads prefs, not palace).
- All existing `runRepositoryContract` / prefs tests stay green.

## Decisions captured

- **D1 — Orientation:** added to Room settings' Studying section (per direction), stored as a
  **global** `studyDirection` preference (so palace-scope study works without a Room
  data-model change). *If genuinely per-room orientation is wanted later, that needs a
  `Room.settings` field + palace-scope fallback — out of scope here.*
- **D2 — Old palace fields:** `shuffleCards`, `textToSpeech`, `studyDirection` on
  `PalaceSettings` are left in place (unused) to avoid a schema migration.
- **D3 — Swipe editor placement:** inline in the Studying section vs its own sub-screen/sheet —
  resolve during planning; default to inline disclosure for fewer navigations.

## Files touched (by FSD slice)

- `entities/preferences/model/types.ts` — new global fields, defaults, input/changes.
- `widgets/flashcard-swipe-settings/*` — new mode-tabs swipe editor.
- `widgets/study-session/ui/StudyDeck.tsx` — remove long-press.
- `widgets/study-session/ui/card-faces.tsx` — gear icon swap.
- `widgets/study-session/ui/GearSheet.tsx` → `StudySheet.tsx` — slim to quick actions + mode
  toggle + scope; drop Finish.
- `widgets/study-session/ui/FlashcardsPanel.tsx` — drop long-press/QuickActionsSheet/finish;
  read prefs.
- `widgets/study-session/ui/QuickActionsSheet.tsx` — delete.
- `pages/study/ui/StudyCardsPage.tsx` — source prefs globally; stop palace persistence.
- `pages/room-settings/ui/RoomSettingsPage.tsx` — new Studying section.
- `shared/i18n/locales/en.ts` — keys.
- Tests as listed in §7.
