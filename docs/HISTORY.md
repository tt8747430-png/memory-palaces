# History

What the app has, by place, and what was fixed. Each line is checked against `src/`. Why a thing is the way it is
lives in its [decision record](adr/README.md); how code is written lives in [CODE_STYLE](CODE_STYLE.md). Open work is
in `.scratch/`.

## Built

### App shell

- `Bootstrap` builds the services behind the splash and shows an error screen with Reload if that fails; RxDB and
  supabase-js stay off the entry graph (`npm run check:entry-graph`).
- The splash holds by reason (`intro`, `boot`, `session`, `first-sync`) and the app under it is `inert`, so nothing
  is focused or announced before it lifts. Skip reads **Open now** during a first Sync. [ADR 0005](adr/0005-sync.md)
- One header (`AppHeader`, one height everywhere) painted `.chrome`, the status bar's colour, in both themes.
  [ADR 0007](adr/0007-the-status-bar.md)
- Search lives in the header: the bar's contents go `inert` and fade, the field slides in from its control's side.
- One bottom dock: `AppNav` shows on the main pages only, and a page in select mode borrows the dock for its toolbar
  (`BottomSlot`). [ADR 0002](adr/0002-the-shell-and-the-keyboard.md)
- The shell is anchored to the screen and the keyboard covers it; a page footer has two positions.
  [ADR 0002](adr/0002-the-shell-and-the-keyboard.md)
- Light and dark themes from one token set; the theme follows the account.
- Notifications: a bell and a page holding level-ups, streaks and quiz results, kept on the device (cap 40).
- A new version waits for the learner's **Update** (`UpdatePrompt`, `registerType: 'prompt'`).
- App icon and iOS launch screens generated from `shared/config/brand-mark.ts` (`npm run brand:assets`).
- `/dev/kitchen-sink` with a live viewport probe, and Settings → Developer, in every build until 1.0.
  [ADR 0002](adr/0002-the-shell-and-the-keyboard.md)
- Lexend ships its latin and latin-ext subsets only; other scripts fall back to the platform sans.

### Library

- Folders, decks and subdecks. Select mode is flat, carries a selection as a stack and drops it as a block.
  [ADR 0001](adr/0001-drag-and-drop-and-card-stacks.md)
- Selecting a deck takes its subdecks; long-pressing a subdeck selects its top deck.
- Moving goes through `DestinationSheet`; a deck dropped on a folder row files into it.
- The archive is a place, with its own page and an Undo on the archive toast. [ADR 0003](adr/0003-the-library.md)
- Orders (Manual, Name, Recent, Due, and the Bible's), per-deck subdeck orders with the `sortSubdecks` action,
  filters (All, Favourites, Due, and the Bible's books and kinds), all set in select mode and kept.
  [ADR 0003](adr/0003-the-library.md)
- Sorts, filters and actions are offered only where they apply. [ADR 0003](adr/0003-the-library.md)
- `DeckSwitcher`: the deck's name in its header opens its subdecks and **More decks…**.
- The rows left open in the Library are remembered and follow the account (`libraryExpanded`).
- A configurable select toolbar (up to four actions); its `style` action gives the selection one card style.

### Deck and cards

- The card list: search, sorts (manual, recent, name, due, flagged), a filter sheet (maturity, flagged), windowed
  for large decks. [ADR 0010](adr/0010-large-decks.md)
- The card browser draws the real neighbouring cards behind the one in view, on the side the swipe heads, with a
  filmstrip between previous and next.
- One set of card actions for the menu sheet and both swipe rails: study from this card, set a grade, mark known,
  flag, freeze, reverse, reset, move, learning history, delete.
- A card's learning history and progress sheets.
- Import: paste notes, a CSV or Anki text file, a Mindscape export, or an extension; every import goes through import
  review. Export to CSV and Anki text.
- Questions per deck, a quiz and a match game.

### Study

- Two learning algorithms: Spaced repetition (`shared/lib/srs`) and Fast review. A Fast pass remembers: it offers the
  cards not yet got right and starts over once all are. [ADR 0008](adr/0008-deck-settings.md)
- Four display modes: blur, words (rebuild the answer from its words), initials, type.
- Answer by swipe or by tap: four edge strips run the directions' actions, the middle flips a prompt and runs a set
  action on a revealed card; a flip button on both faces. A card stays turned until the queue moves on.
- Swipe actions are kept per algorithm and per display mode, so Fast review offers Not quite and Got it, never grades.
- Study filters (all, due, new, learning, flagged), and study from a picked card, running on in the list's sort.
- Leaving mid-session pays XP for what was graded; Fast review pays only for cards got right.
- A card style is a scene: 11 presets, each with a night rendition, plus font, size and alignment; the scene runs from
  the header to the safe area and the footer's controls float on it.
- Read aloud, per deck (`settings.tts`).
- A finished session, quiz or match ends on `ResultScreen`: three stat tiles, **Done** first.

### Deck settings

- Deck settings: rename and appearance, move, duplicate and archive (both confirmed; archiving leaves the deck),
  reset progress, import, export, delete. [ADR 0008](adr/0008-deck-settings.md)
- The algorithm screen, owned by the main deck; a subdeck shows it locked and says why.
  [ADR 0008](adr/0008-deck-settings.md)
- The card style page: a live preview with a scrollable card, a full-screen preview, a draft that only **Apply**
  writes, Reset, and **Apply to…** this deck, its subdecks or every deck. [ADR 0008](adr/0008-deck-settings.md)

### Profile and progress

- XP and levels, a streak with freezes and its calendar page, achievements and badges.

### Settings

- Profile (avatar, password change, delete account), Sync, Extensions, Select toolbar, Swipe actions, Help, Privacy,
  About, Developer.
- The select toolbar and swipe editors: the live bar is the editor, a palette switches actions on and off.
  [ADR 0001](adr/0001-drag-and-drop-and-card-stacks.md)
- Settings follow the account and go up by themselves (theme, dev mode, Autosync, the Library's open rows).
  [ADR 0005](adr/0005-sync.md)

### Sync and account

- Manual Sync: a banner, a review dialog for destructive divergence only, Autosync on by default.
  [ADR 0005](adr/0005-sync.md)
- Settings → Sync: a status card with the account's email, what is waiting per table, the quiet settings row,
  Autosync, the last ten Syncs, and **Check everything against the cloud**. [ADR 0005](adr/0005-sync.md)
- An account's first Sync on a device runs under the splash. [ADR 0005](adr/0005-sync.md)
- Merging field by field against what each device saw. [ADR 0005](adr/0005-sync.md)
- Learning history syncs; a daily `pg_cron` job trims each account to its newest 2000 entries, as the device does.
- Private image buckets, bytes cached ahead of the read. [ADR 0004](adr/0004-what-needs-the-network.md)
- Sign-in by email and password or Google, and a guest mode; offline, the auth screens say so.
  [ADR 0004](adr/0004-what-needs-the-network.md)
- Account deletion with a 30-day grace, cancelled by signing in, purged nightly by Edge Function (checked live on the
  hosted project, 2026-10). [ADR 0004](adr/0004-what-needs-the-network.md)

### Extensions and Bible

- The extension layer, Settings → Extensions, per-extension overviews and features. [ADR 0009](adr/0009-extensions.md)
- Bible passage import: a jump field (`ioan 3 16-18`), recent passages, books by testament tinted by kind, chapter
  and verse range on one step, a breadcrumb, the verse text box (prefilled where the library holds text), split into
  verses, duplicates named as ranges and skipped by default, chapter decks or one chosen deck.
  [ADR 0009](adr/0009-extensions.md)
- References and deck names in Romanian (Cornilescu 2024); the UI stays English. [ADR 0009](adr/0009-extensions.md)
- The verse corpus is shared by every account and published by named publishers only; the developer tools add text
  from cards or a deck and forget a book. [ADR 0009](adr/0009-extensions.md)
- The Bible's Library orders (Biblical order with Old and New Testament headings, by kind) and book filters.
- Paste Notes is notes-only; the Bible verse parser lives in the extension.

## Fixed

Newest first within each area. Symptom — cause — what holds it now.

### App shell

- A strip at the bottom of the installed app, the whole app lifted (2026-10) — `black-translucent` sizes the web view
  as if the bar were opaque — `black` style, [ADR 0007](adr/0007-the-status-bar.md), `viewport-sample.test.ts`.
- The status bar in the wrong colour: over the study scene, the splash, a backdrop, in dark mode, white when a toast
  came near (2026-07 to 2026-10) — one bare light `theme-color` meta, and the theme painted from the store's default
  before preferences loaded — [ADR 0007](adr/0007-the-status-bar.md), `status-bar.test.ts`, `boot-paint.test.ts`,
  `use-device-theme.test.ts`.
- A seam between the status bar and the header (2026-09) — a translucent header under a flat bar — `.chrome`,
  `tokens.test.ts`.
- The study header taller than every other (2026-09) — a separate `study` layout on `HeaderBar` — one height,
  [CODE_STYLE §5](CODE_STYLE.md#s5).
- The whole app lifted when a selected word in a drawer field was tapped (2026-09) — fields opened with their text
  pre-selected (`useAutoSelect`), and iOS revealed the selection itself by panning — no pre-selected text; a
  suggestion is the placeholder (`PromptSheet.test.tsx`), [CODE_STYLE §11](CODE_STYLE.md).
- The header search looked cut while it opened, its focus ring clipped and touching ✕ (2026-09) — a `clip-path` wipe
  and a 4px gap under a 5px ring — a slide with opacity, `gap-2`, `HeaderSearch.test.tsx`,
  [CODE_STYLE §5](CODE_STYLE.md).
- A page footer flickered on open and lifted at the end of a scroll (2026-09) — a `sticky` footer inside the scroll
  body, and pages that swapped a footer-less shell for a full one once data arrived — two footer positions, one shell
  from the first render, `AppScreen.test.tsx`, [ADR 0002](adr/0002-the-shell-and-the-keyboard.md).
- The bottom nav went see-through for a frame when select mode closed, and the select toolbar sat under the nav's exit
  (2026-09) — two docks cross-fading, the inset cleared mid-animation — one `BottomDock`, `bottom-slot.test.ts`.
- Panels blending into the page gradient (the Sync banner, notes, toggles) (2026-09) — light surfaces with no edge —
  tone borders and `noteSurface`, `SyncBanner.test.tsx`, `tokens.test.ts`, [CODE_STYLE §5](CODE_STYLE.md).
- The app, not the sheet, rose with the keyboard; the header moved; pages scrolled past their content (2026-07) — the
  shell sized to the visual viewport, then pan compensation — [ADR 0002](adr/0002-the-shell-and-the-keyboard.md),
  `keyboard-viewport.test.ts`.
- The nav, the toolbar and focused fields showed over the splash (2026-07) — the app was live under it — the app is
  `inert` while the splash shows, `Bootstrap.test.tsx`.

- Progress bars replayed their fill on every page change (2026-07) — `Progress` filled from zero on each mount —
  the fill starts from zero only with `animateOnMount`, `progress.test.tsx`, [CODE_STYLE §9](CODE_STYLE.md#s9).
- Shadows on folders, decks, swipe rails and the select toolbar didn't render (2026-07) — cause not recorded — the
  semantic shadow tokens (`shadow-rest`, `-interactive`, `-elevated`), [CODE_STYLE §5](CODE_STYLE.md#s5).
- The launch screen was unreliable on iOS (2026-07) — launch images missing or not matching the screen — a light and
  a dark `apple-touch-startup-image` for every iPhone and iPad size, generated from the brand mark,
  `launch-screens.test.ts`.

### Library

- A Bible book deck missing from the Library while its verses counted as held (2026-09) — another device deleted the
  folder it had been moved into; the divergence check ignored decks this device held, and the tree is read from the
  top — `reachableDecks` (`deck-tree.test.ts`) and moved-in descendants (`sync-now.test.ts`),
  [ADR 0003](adr/0003-the-library.md).
- The move sheet and deck switcher ignored the sort, the filter and the group headings (2026-09) — they ordered by
  `order` alone — one arrangement, `library-arrangement.test.ts`, `DestinationSheet.test.tsx`.
- A filter vanished when select mode closed (2026-09) — held in component state and reset on exit —
  `preferences.deckFilter`.
- A per-deck Due order sorted that level by name (2026-09) — due counts were requested for the top and scoped orders
  only — `library-arrangement.test.ts`.
- **Move** on a card opened an empty sheet (2026-09) — it counted archived decks — `card-actions.test.ts`.
- The Library's due badge disagreed with the deck page for a Fast review deck (2026-09) — the roll-up ignored each
  deck's algorithm — `deck-tree.test.ts`.
- The selected tint in the move sheet ran into the + glyph (2026-09) — no gap between toggle and row — `gap-1.5` in
  `DestinationTree`.
- Moving a deck out of a folder turned its subdecks into decks (2026-07) — cause not recorded — a batch drops every
  deck a selected ancestor carries (`idsWithoutDescendants`), [ADR 0003](adr/0003-the-library.md).
- Deleting a folder left its decks (2026-07) — the deck was unfiled — [ADR 0003](adr/0003-the-library.md).
- Rows flickered on drop while reordering (2026-07) — four causes, listed in [CODE_STYLE §10](CODE_STYLE.md) —
  [ADR 0001](adr/0001-drag-and-drop-and-card-stacks.md).

### Deck and cards

- Opening a 1,000-card deck took about 2 s, and an edit re-rendered every row (2026-09) — every row mounted, a
  deep copy of the collection per write — [ADR 0010](adr/0010-large-decks.md), `rxdb-repository.test.ts`,
  `ReorderableList.test.tsx`.
- A tap on an open leading swipe action did nothing (2026-09) — the trailing tray lay over the row at `opacity: 0`,
  still hit-testable — each rail takes pointers only when open, `SwipeRow.test.tsx`, [CODE_STYLE §5](CODE_STYLE.md).
- Swiping back in the card browser showed the next card behind (2026-09) — the stack ignored the drag's direction —
  `use-card-browser.test.ts`.
- Swiping a second row left the first half open and flickering (2026-07) — rows didn't release each other — an open
  row closes when another takes the touch, `SwipeRow.test.tsx`.
- The Learning history and Delete actions missing from the card menu (2026-07) — the sheet's list had no scroll
  region, so the last actions fell outside the drawer — `ActionSheet.test.tsx`.

- The practice tile said Test while the quiz it opened said Quiz (2026-10) — two names for one mode — Quiz
  everywhere, [UBIQUITOUS_LANGUAGE](UBIQUITOUS_LANGUAGE.md), `PracticeModes.test.tsx`.

### Study

- A study session closed midway paid no XP (2026-09) — XP was paid only on completion — `FlashcardsPanel.test.tsx`,
  `rewards.test.ts`.
- **Study from this card** ran 14, then 1, 2… (2026-09) — the picked card led the due queue — the run continues in
  the list's sort, `study-filter.test.ts`, `StudyCardsPage.test.tsx`.
- Fast review "did not save" (2026-09) — answers saved, but every pass offered every card again — a pass remembers,
  `study-filter.test.ts`, `study-overview.test.ts`.
- An all-frozen Fast deck claimed "Every card got right" (2026-09) — a computed `caughtUp` was never read —
  `study-overview.test.ts`.
- Initials mode printed `––` for a lone dash (2026-09) — a token with no letters matched as both lead and trail —
  `recall.test.ts`.
- Three cards' text visible at once on the `frost` style (2026-09) — the only translucent preset face — faces are
  opaque, `card-style.test.ts`, [CODE_STYLE §5](CODE_STYLE.md).
- Card styles ignored the dark theme, and toasts followed the OS (2026-09) — light-only skins, sonner on `system` — a
  night rendition per preset, `card-style.test.ts`, `CardScene.test.tsx`.
- A Fast review swipe promised "GOOD" and was swallowed (2026-09) — swipe actions were keyed by display mode only —
  per algorithm, `use-study-settings.test.ts`, `DirectionChip.test.tsx`.
- Undo brought the card back answer side up (2026-09) — undo kept `flipped` — `FlashcardsPanel.test.tsx`.
- Type and Rebuild opened turned over when switched to from a turned card (2026-07) — the mode kept `flipped` —
  `FlashcardsPanel.test.tsx` ("lands the new mode on its front face").
- Type mode cleared the typed text and its feedback once complete (2026-07) — cause not recorded — `TypeFace.test.tsx`.
- Long card text pushed the grade bar off screen (2026-07) — the card grew with its text — the card holds its height
  and scrolls inside.

- Blur and Show all were different widths (2026-07) — each button sized to its label — equal columns, `BlurFace.tsx`.

### Sync and account

- "Everything is synchronised" while an edit was lost (2026-09) — the newer whole document won, XP took `max` —
  [ADR 0005](adr/0005-sync.md), `merge-fields.test.ts`, `conflict-handlers.test.ts`.
- Settings, history and progress writes showed nothing waiting and started no Autosync (2026-09) — only the content
  stores logged pending changes — [ADR 0005](adr/0005-sync.md).
- "7 changes waiting" for a theme change and an opened row (2026-09) — preferences were held — two cadences,
  `quiet-sync.test.ts`.
- The other device waited for a tap to pull (2026-09) — Realtime only lit the banner — Autosync follows
  `cloudChanged`, `use-autosync.test.tsx`.
- "Synchronising…" forever (2026-09) — no request timeout — 30 s per request, 100 ids per lookup.
- Repair dropped what each document was based on (2026-09) — `replicationState.remove()` — `rereadEverything`,
  [ADR 0005](adr/0005-sync.md).
- Raw "JWT" errors on Sync (2026-09) — an expired token, or a device clock the server reads as future — one refresh and
  retry for a token, a named message for the clock, `sync-failure.test.ts`, `sync-now.test.ts`.
- "Error while loading: the fetch was aborted" (2026-09) — aborts and network drops shown raw — reason `network`,
  "The connection dropped or timed out", `sync-failure.test.ts`.
- A Delete answer lost to the edit it overruled (2026-09) — the tombstone kept its old clock —
  `apply-pending-deletions.test.ts`.
- Sign-out failed offline and stranded the app (2026-09) — the revoke error was rethrown —
  [ADR 0004](adr/0004-what-needs-the-network.md), `session-commands.test.ts`.
- "Delete account" deleted no account (2026-09) — local wipe and blanked profile, replicated —
  [ADR 0004](adr/0004-what-needs-the-network.md), `account-deletion.test.ts`.
- Avatars and deck covers readable by anyone with the URL (2026-09) — public buckets — private buckets,
  [ADR 0004](adr/0004-what-needs-the-network.md).

### Extensions and Bible

- Published verses never reached the picker (2026-09) — stored under Romanian names, looked up by English ones —
  book codes, `completeBibleVerse`, `keep-verses-canonical.test.ts`.
- Verses added on one account missing on others (2026-09) — the table was per account — a shared corpus,
  [ADR 0009](adr/0009-extensions.md).
- "You already have …" listed 28 references on one line (2026-09) — joined by commas — ranges, counted and capped,
  `summarise-refs.test.ts`.
