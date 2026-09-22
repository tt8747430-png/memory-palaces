# The page paints the status bar; one Library order; no stranded decks

_2026-09-23_

Eight reports, five causes. Each cause below was confirmed before this design was written — on the
device's own probe log, in the learner's synced data, or in the code path that produces it.

## Causes

| Report | Cause |
| --- | --- |
| Status bar ≠ study scene; splash top; not dimmed by a backdrop; light blue in dark mode | Under `apple-mobile-web-app-status-bar-style: black` iOS paints the bar from the `theme-color` it read at load (`#2850b0`, the literal in `index.html`) and ignores every later change. Proof: in dark mode, where `ThemeProvider` has set the meta to `#0b1533`, the bar is still light blue. Nothing the app does at runtime reaches the bar. |
| Move sheet ignores sort, filter and headings | `DestinationSheet` and `DeckSwitcher` list decks with `rootDecks`/`decksInFolder`/`childDecks`, i.e. by `order` alone. The Library's own arrangement lives in `pages/deck-library/model/use-library-data.ts`, where nothing else can reach it. |
| `1 Corinteni` missing, but "already in your Bible library" | Synced data: the book deck (and its 16 chapter decks) names folder `New Folder 1`, tombstoned at 07:35 — 74 min after the deck was moved in at 06:21. (a) `findDestructive` only looks for descendants the device has **never held** (`!here.has(change.id)`); a deck it held, moved into the folder elsewhere, is not seen, so the folder deletion goes through with no question. (b) The Library tree is walked down from the roots, so a live deck whose folder is gone is on no list anywhere — while its cards still count as held. |
| Whole app lifts when tapping selected text in a drawer | `useAutoSelect` puts a ranged selection in a drawer field before the keyboard is up. A tap on a selection is taken by iOS's own text interaction, which bypasses Base UI's tap-to-focus path (`focusKeyboardInputWithoutPageScroll`), so WebKit reveals the selection itself — by panning the layout viewport. Probe: `FAIL no pan — iOS panned 358px`, `#root at -358`, focused `input` "not inside the reveal scroll body". |
| Search reveal looks cut until it finishes | The field is revealed by a `clip-path: inset()` wipe. A wipe cuts the field and its focus ring until its last frame, and WebKit repaints `clip-path` on the main thread while the keyboard opens at the same moment. |

## A. The page paints under the status bar

`apple-mobile-web-app-status-bar-style` becomes **`black-translucent`**. The web view runs under the
clock and whatever the app paints there is the bar. Every report in the first row is then true by
construction, with no colour bookkeeping:

- A screen's header is `.chrome` with `pt-safe`, so the header block continues up under the clock —
  the same colour in either theme.
- The splash, every backdrop (drawer, dialog, fullscreen dialog) and the finished-session screen are
  `fixed inset-0`: they cover the bar, dimming and blurring it with the page.
- The study session's scene fills the screen from the top; its header paints nothing (B).

**The top inset is anchored.** Translucent was left on 2026-09-06 because iOS reported
`env(safe-area-inset-top)` late and inconsistently — `0` on first paint, and again on rotation and
keyboard dismiss. `shared/lib/top-inset.ts` answers that the way `keyboard-viewport.ts` answers the
keyboard:

- A hidden fixed probe is `env(safe-area-inset-top)` tall; a `ResizeObserver` on it (plus `resize`)
  samples it.
- The value is **held** per shape — display mode (`app`/`tab`) × `innerWidth` — and may be raised,
  never lowered, within a shape. A new shape starts from what that shape remembered.
- It is published as `--safe-top-held` on `documentElement` and remembered in `localStorage`
  (`mindscape:top-inset`, `{ [shape]: px }`). `index.html`'s boot script applies the remembered
  value for the current shape before first paint.
- `theme.css`: `--safe-top: max(var(--safe-top-held), env(safe-area-inset-top))`. `.pt-safe` and
  every raw `env(safe-area-inset-top)` in `src` read `--safe-top`.
- Started once from `Bootstrap` (`useTopInset`), before the splash, and never torn down while the
  app lives.

**The clock stays legible.** Status-bar glyphs are always white under translucent. A light surface
under them gets `StatusBarScrim` (`shared/ui`): a `--status-scrim` gradient (tokens) from the top
edge, `calc(var(--safe-top) * 1.5)` tall — zero in a browser tab. It is drawn by `CardScene` when a
screen asks for it (`underStatusBar`) and the scene is light, and by `AuthScreen` in the light theme.
A scene's tone is `sceneTone(style, scheme)` in `card-style`: the preset's `chrome`, or the scheme
for `plain`, which is made of the theme's own tokens.

**Android** keeps `theme-color` (it honours runtime changes): `ThemeProvider` still writes
`--status-bar`. The manifest's `theme_color`/`background_color` — stale `#091A7A`/`#ADC8FF` — become
the splash's top colour, so the OS launch screen hands over to the splash without a seam.
`boot-paint.test.ts` holds `index.html`, the manifest and the tokens together.

**The probe follows the model.** `status-bar.ts` loses `statusBarIsPainted` (a sampling platform is
no longer the model); it keeps the Android check (`statusBarIsDeclared`) and `paintedBehind`, whose
alpha parsing learns the slash syntax (`oklch(… / 0.38)` was read as opaque). The kitchen-sink probe
gains `status style`, `--safe-top` and `env top` rows, and a **top inset** check: in standalone the
style is `black-translucent` and the published inset is at least what `env()` reports.

Recorded as **ADR 0006**; MOBILE_DESIGN §12 and CODE_STYLE §4a/§11 are updated to it.

## B. The study session's header

- `StudySessionHeader` paints nothing — the scene runs under it and under the clock, as it already
  runs under the footer.
- It is the same bar as every screen: `HeaderBar`'s fixed `h-16`. The `study` layout is deleted and
  `HeaderBar` loses its `layout` prop — one height.
- The count pill stays centred. `HeaderTrack` floats on the header's bottom edge
  (`absolute inset-x-4 bottom-0`) and takes no height.
- `StudySessionHeader` takes no `children`. Quiz passes `progress` (`done` = the question reached)
  instead of drawing its own bar; Match's chips move into the body under the header.
- `FlashcardsPanel`'s `CardScene` passes `underStatusBar`. `scene-chrome.test.ts` keeps walking the
  header.

## C. One Library arrangement

`shared/lib/library-arrangement.ts` — pure, generic over `TreeDeck & SortableDeck`:

```ts
arrangeLibrary({ decks, folders, prefs, orders, filters, dueOf }): LibraryArrangement
```

- `prefs` is `SubdeckOrderPreferences` plus `filter: DeckFilterId`.
- `decks` are made reachable first (D). `arrangement.decks` is that set, and is what every reader
  and every write's peer lookup uses.
- `folders` — shelf order: by `order`, then `folderOrderOf(topOrder)`.
- `shelf({ folderId })` / `shelf({ deckId })` → `{ decks, levelDecks, hidden, headings }` — the
  level sorted by its order, narrowed by the filter, headed by `headingsFor`. A filter narrows the
  list being read, never a deck's contents.
- `subdecks(deckId)` — sorted by that deck's own order, unfiltered.
- `orderAt(parentId)` — the resolved order a level follows.
- `flatten(place, expanded)` → `FlatDeck[]` — the shelf, then expanded subdecks. Replaces
  `tree-flatten.ts`'s `arrange` callback.
- `filterDecks` moves here from `pages/deck-library/model/library-filter.ts`.

`widgets/deck-tree/model/use-library-arrangement.ts` is the only way in:
`useLibraryArrangement(decks, folders)` reads the order preferences and the filter, the contributed
orders and filters, and the cards — counting what is due only when an order or the filter at some
level needs it — and memoises `arrangeLibrary`.

Readers:

- **Library** (`useLibraryData`): hands its optimistic decks and folders in; everything the page
  shows — browse rows, select list, headings, hidden count, folder counts, emptiness — comes out.
- **`DestinationSheet`** (move, "More decks…", Bible import, card editor, deck settings): Archive and
  Home, then the folders in shelf order with their shelves, then the top shelf — each with its group
  headings (`GroupHeading`), subdecks in their own order. When the filter hides decks, one line says
  so (`FilteredNotice`, moved to `widgets/deck-tree` for both screens).
- **`DeckSwitcher`**: its short list is `subdecks(deck.id)`.

## D. No stranded decks

**Read side.** `reachableDecks(decks, folderIds)` in `shared/lib/deck-tree.ts`: a live deck whose
folder is gone, whose parent is gone or archived, or whose parents loop, stands at the Library top
(`parentId: null, folderId: null`) — a new object for those decks only, identity kept for the rest.
Read-side, not a keeper: a pull can land a deck before its folder, and a keeper would unfile it for
good. It writes nothing; a later move places the deck for real. The learner's `1 Corinteni`
reappears at the top of the Library with no write to their data.

**Sync.** `findDestructive`'s candidates are every peeked live child that is not pending here —
held or not. A child held here whose cloud copy now names a container this device deleted was put
there elsewhere; it is a descendant like any other. A found deck carries its **local** subtree
(subdecks, cards, questions): Delete tombstones them with it, Keep leaves them where they are.

**Duplicates.** The Bible import counts a card as held only when its deck exists.

## E. No pre-selected text in a sheet

`useAutoSelect` is deleted. A suggested value is the field's placeholder and its fallback, never
text the learner has to select:

- `PromptSheet`: `initialValue` → `suggestion` (placeholder, and what is submitted when the field is
  left empty). Create deck, subdeck, the Bible's deck name, the numeric prompts (the current value).
- `FolderSheet` (new): the default name is the suggestion; `AppearanceFields` takes `suggestion` and
  loses `autoFocusName`. Editing keeps the folder's name as the value.
- `DeleteAccountSheet` loses a select that only ever selected nothing.

CODE_STYLE §11's selection note is updated.

## F. The search field slides in

`HeaderSearch` reveals with opacity and a 12px slide from the side the search control sits on —
compositor-only, nothing clipped. Reduced motion: opacity only. The ring-inset `clip-path`
constants go.

## Testing

- `arrangeLibrary`: folders by order and name; shelves sorted, filtered at the top only; headings by
  group; subdeck orders; `flatten` honours `expanded`; `dueOf` only called when needed.
- `reachableDecks`: dead folder, dead parent, archived parent, cycle, untouched identity.
- `findDestructive`: a held deck moved into a deleted folder is a descendant, with its local cards.
- `DestinationSheet`: order, filter line, headings; `DeckSwitcher` subdeck order.
- `top-inset`: held per shape, raised never lowered, remembered, applied from memory.
- `PromptSheet`/`FolderSheet`: empty submits the suggestion; typed text wins.
- `StudySessionHeader`: `h-16` bar, floating track, no `.chrome`.
- Probe: new rows and the top-inset check. `boot-paint`: meta style, manifest colours, top-inset key.
- `npm run typecheck && npm run lint && npm run test && npm run build && npm run check:entry-graph`.

**On device** (kitchen-sink probe): header under the clock in both themes; splash, drawer, dialog and
card browser cover the bar; study scenes run under it; the top inset does not move across launch,
keyboard open/dismiss; a drawer's prefilled name no longer lifts the app; the search field slides
in whole.
