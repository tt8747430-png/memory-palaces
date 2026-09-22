# Chrome, live editors, a footer that stays put

_2026-09-22_

Five changes that share one theme: a surface should be the thing it looks like. The status bar and the header
should be one block, not two. An arrangement should be edited on the bar it arranges, not on a proxy strip
beside it. A filter set while choosing rows should still be set after the choosing stops. A footer that looks
pinned should be pinned. A finished session should own the screen it finishes on.

## A. Chrome — the status bar is the header

### What is wrong

`--status-bar` is `#091a7a` in light and `#0b1533` in dark. The platform paints a flat rectangle in that colour
and the app's header sits directly beneath it in `bg-glass` — `--surface-glass-sky`, translucent, blurred. A
navy strip meets a pale one at a hard seam on every screen.

Two constraints decide the direction of the fix, and both close the other door:

1. **The glyphs are white.** `apple-mobile-web-app-status-bar-style: black` means iOS draws the bar's clock,
   signal and battery in white over `theme-color`. Making the bar pale hides them. Changing the style meta is
   what [ADR 0002](../../adr/0002-keyboard-covers-the-app.md) records three wrong fixes for; it is not a knob
   to turn on inference.
2. **A translucent header has no colour to match.** `bg-glass` renders differently as content scrolls under it.
   A flat bar can never equal a moving value. "Same colour as the header" therefore requires an opaque header
   whatever the hue.

So the header matches the bar, not the reverse.

### Tokens

`--status-bar` remains the single source of truth: `index.html` carries a hex copy for the paint before the
stylesheet lands, `ThemeProvider` reads the token and hands it to the platform, `boot-paint.test.ts` holds the
copies together. It is not replaced, wrapped or renamed.

Beside it in `tokens.css`, one set for both schemes — white reads on either navy:

| Token                | Value                    | For                                       |
| -------------------- | ------------------------ | ----------------------------------------- |
| `--chrome-surface`   | `var(--status-bar)`      | the header block, the result screen       |
| `--chrome-ink`       | `oklch(100% 0 0)`        | titles, icons, anything that reads as ink |
| `--chrome-ink-muted` | `oklch(100% 0 0 / 0.74)` | subtitles, counts, secondary labels       |
| `--chrome-ink-faint` | `oklch(100% 0 0 / 0.52)` | placeholders, disabled ink                |
| `--chrome-fill`      | `oklch(100% 0 0 / 0.12)` | glass buttons, fields and chips on it     |
| `--chrome-edge`      | `oklch(100% 0 0 / 0.16)` | hairlines on it                           |

Light `--status-bar: #091a7a` and `--p-navy-900: oklch(29.4% 0.16 266.1)` convert to the same sRGB
triple — they were already one navy written twice, which nothing said out loud. The hex stays
(`index.html` cannot evaluate `oklch()`) and gains a comment naming the palette entry it is the sRGB
form of, so the next person to touch either knows they move together. `boot-paint.test.ts` grows an
assertion that the header is painted from the same token the bar is.

`--nav-surface` is deliberately **not** folded in. The dock pill is `color-mix(…, var(--nav-surface) 62%,
transparent)` over a `backdrop-blur` — a translucent material, not a block. Pulling it to the dark theme's
`#0b1533` would make it vanish against that theme's canvas. Top chrome and bottom chrome are allowed to be
different materials; they were never claimed to be the same one.

### Components

`theme.css` gains one utility, `.chrome`, and that is the whole mechanism:

```css
.chrome {
  background: var(--chrome-surface);
  color: var(--chrome-ink);
  --text-heading: var(--chrome-ink);
  --surface: var(--chrome-fill);
  --primary: var(--chrome-ink);
  --primary-foreground: var(--chrome-surface);
  /* …every other semantic role, at its on-chrome value */
}
```

`@theme inline` compiles `text-heading` to `var(--text-heading)` **at the use site**, so redeclaring
the role on the box makes every child that already names a semantic token read the chrome value here
and the page value everywhere else. `AppHeader` and `StudySessionHeader` take the class; nothing
inside either needs a chrome variant, an override, or a single edit.

That is why there is no ink sweep. An earlier draft of this spec listed twelve components to retag
and a new `IconButton` variant to add; all of it turned out to be the design system doing its job
badly on purpose. The two real edits are the places that named a colour for a *reason that stops
being true on a dark block*:

- `HeaderTrack`'s `bg-primary/10` → `bg-info-surface`. `--primary` is deliberately not the ink on
  chrome, so a navy track on a navy block showed nothing.
- `HomeHeader`'s `bg-secondary/40` XP track → `bg-info-surface`. It ended where the bar's own
  gradient ends, so a full bar and an empty one looked alike.

Chrome is a dark context inside whatever theme is on, so ink, neutral surfaces, status *foregrounds*
and brand fills all take their on-chrome values — `--primary` is the ink and `--primary-foreground`
is the block, which makes a CTA in a header a white pill with navy on it, and the avatar's gradient
and the level bar legible without either naming a colour.

`body` is already painted `--status-bar`, so top overscroll becomes continuous with the header for
free.

**Amended after first device look — the block is a softer blue.** The navy (`#091a7a`, L 29%) sat on
the pale canvas as a hard band that pulled the eye off the content. Light `--status-bar` is now
`#2850b0`, the sRGB form of `oklch(46% 0.16 264)` — no palette entry, since nothing else paints with
it; white glyphs still read on it at 7.3:1, so the style meta stays `black`. Dark is unchanged — its canvas is already
near its bar. `--status-bar` stays the one source; `index.html` carries the new hex.

Every value `.chrome` redeclares is a `var(--…)` — the on-chrome danger ink is `--p-red-300` in the
palette, not a literal — and `tokens.test.ts` refuses anything else. Two ink edits inside the header
came with the sweep and are part of it: `SelectHeader`'s actions and `HomeHeader`'s level label move
from `text-accent`/`text-primary` to `text-heading`, the role whose on-chrome value is the ink.

`SelectHeader`'s exit reads **Done**, not Cancel: every change made in select mode is already saved,
so a Cancel after a reorder read as the way to take the reorder back.

**Status on chrome.** `.chrome` answers for the status roles too — `--success`, `--warning`, `--danger`
and their foregrounds, surfaces and edges — as light tints added to the palette (`--p-green-200`,
`--p-amber-200`, `--p-red-200`), each 4.5:1 or better on both blocks. Surfaces and edges are mixed
from the tint inside `.chrome` (`color-mix(in oklch, var(--success) 18%, transparent)`), not
inherited: a token mixed at `:root` is computed there and would keep the page's ink. The same goes
for `--info-border` and `--notification-unseen-ring`. Gold rating, the dock, the scrim, the page
canvases and the action accents read the same on either surface and stay as they are, each named in
the test with its reason.

### Testing

- `tokens.test.ts` — each `--chrome-*` token is declared exactly once; the colour roles are derived
  from `:root` rather than listed by hand, and `.chrome` answers for every one not exempted with a
  reason; it names no colour of its own — a token, or a tint mixed from one.
- `boot-paint.test.ts` — `theme.css` paints the chrome from `--status-bar`, as it already asserts
  for `body`.

## B. Live action editors

### What is wrong

Both arrangement screens draw the thing being arranged and then ask the learner to arrange it somewhere else.
Settings → Select toolbar shows an inert `DockPill` and an `ActionSlots` strip beneath it. Settings → Swipe
shows an inert `SwipePreview` and **two** `ActionSlots` strips, one per rail, each with a `1/2`-style count
pill and a `+` that opened a sheet listing what was left.

### Shape

Two surfaces per screen, each answering one question.

- **The bar says *where*.** It is the real thing, live: `SelectToolbarBar` is the dock's own pill at the dock's
  own size drawing `SelectToolbarSlot`, the component the live toolbar draws; `SwipeRailsBar` is a sample row of
  the chosen kind with both swipes open. Every face drags to reorder, and every face carries a `CloseBadge` that
  takes it off (`SortableActionSlot` — the badge is a sibling of the drag handle, never inside it). The select bar
  keeps its last action: no badge at one (`selectToolbarCanShrink`), because a bar with nothing on it cannot
  be got out of. A rail cap is a 36px face with a 44px target; the select bar's drag overlay is the slot
  itself, so nothing changes shape on the drop.
- **The palette says *which*.** `ActionsPalette` is every action the surface has, in one row that scrolls sideways,
  each a switch — on wears the action's colour, off is a dashed outline of the same tile, and a corner mark (`✓` /
  `+`) says it in a shape as well as a colour. One tap adds, one tap removes. No sheet, no drawer, no sample row
  inside it: the row is drawn once, in the bar. The palette, the rails and the drag overlay draw one face,
  `ActionFace` (filled, or the outline standing in for it).

A switched-on swipe action joins **the end of the right-hand swipe** (`withSwipeAction`, over `railWithRoom`),
falling to the left only once the right is full; from there the learner drags it to either side. There is no
per-side add. What fits is `shared/config`'s to say for both editors — `railWithRoom` / `railsFit` for the rails,
`selectToolbarHasRoom` / `selectToolbarCanShrink` for the bar — never the page's.

`model/action-rails.ts` makes a swipe's two rails **one run of actions with the row standing in the middle**
(`ROW`): `railsToFlat` / `flatToRails`. Dragging a cap past the row is what moves it to the other side — also what
the gesture it configures means — so one ordinary sortable list reorders, changes sides and changes how many each
rail holds.

`model/use-sortable-list.ts` holds what both bars share: sensors, the active id, the one `dropAnimation`, and a drop
that may be **refused** (a rail has a maximum, and trimming instead would take an action off unasked). It wraps
`useHeldOrder`, so a dropped order survives the store's half-applied re-emissions ([CODE_STYLE §10](../../CODE_STYLE.md),
cause 1).

`ActionSlots`, `SlotCount`, the page-local `SwipePreview` and the picker sheet are deleted.

Preference shapes (`swipe`, `selectToolbar`) are unchanged. No schema step, no migration.

### Testing

- `action-rails.ts` round-trips every shape of rails and reads a list that lost its row; `railsFit`,
  `railWithRoom` and `withSwipeAction` are tested beside them in `shared/config/swipe.test.ts`, and
  `selectToolbarHasRoom` / `selectToolbarCanShrink` in `select-toolbar.test.ts`.
- Each bar draws every placed action draggable; a badge takes an action off whichever rail it is on; the select bar
  shows no badge at one.
- The palette draws every action as a switch, adds and removes with one tap, disables adding when full, and never
  disables what is already on except the select bar's last.

## C. A filter set in select mode stays set

### What is wrong

`useLibrary` holds `filter` in `useState` and `selection.exit` resets it to `'all'`. The arrange bar only
exists in select mode, so the learner sets a filter, leaves, and the filter is silently gone.

### Shape

`filter` becomes `preferences.deckFilter`, alongside `deckSort` which is already a preference and already
persists. `selection.exit` stops resetting it; it still resets `scopeId`, because a scope is a way of looking
at one deck's subdecks and a filter is a setting.

Persisted data, so back-compat is real:

- `preferencesSchema` `version: 7 → 8`, property `deckFilter: { type: 'string' }` — open, not an enum, because
  an extension contributes filters under its own ids, exactly as `deckSort` already is.
- `preferencesMigrations[8]` adds the field at its default.
- The read-side twin is `makePreferences`, which already resolves every field through `?? DEFAULT_PREFERENCES`
  — replication writes pulled rows unmigrated, so the entity must recognise a row that never had the field.
- `PreferencesChanges` gains `deckFilter`; `selectDeckFilter` joins the selectors that own their defaults.
- Nothing server-side: a row's payload is the `data` jsonb column (`document-mapping.ts`), not named columns.

Browse mode then shows filtered rows and must say so. The `deck.filterHidden` line the select bar already
draws moves into a small component shown in both modes; in browse it is a button that enters select mode,
which is where the filter can be changed. No new copy beyond one label key for that affordance.

`isEmpty` (`use-library-data.ts`) is checked and, if it counts post-filter rows, changed to count pre-filter
ones: a filter that matches nothing must read as *filtered*, never as *this library is empty* — the latter
offers "create a deck" over decks that exist.

The tree is narrowed **at depth 0 only**. The filter is about the list being looked at; applied further down it
would drop a subdeck from the deck it belongs to rather than from the list, and a parent kept by the filter would
open onto a hole. Depth 0 is the set the flat sections hold, so the two views agree by construction.

### Testing

- The filter survives `selection.exit`.
- The tree is narrowed with the flat list — browse and select are two views of one Library.
- Migration 8 fills the field, and keeps a filter a newer build stored rather than resetting it.

## D. A footer that stays put

### What is wrong

`AppScreen`'s footer is `sticky bottom-0 mt-auto` **inside** the scroll body, going `static` under
`data-keyboard`. Inside the scrollport it is subject to the scrollport: its flow position sits above the
body's `padding-bottom`, so at the end of the scroll it leaves the screen edge; and it is laid out again on
the first paint of real content, which is the flicker.

### Shape

The footer gets two positions and moves between them on `useKeyboardOpen()` — the boolean half of
`useVirtualKeyboard()`, on the same measurement and subscription, so the shell re-renders once per keyboard
episode rather than on every height step.

```
<div class="flex h-full flex-col">
  {header}{pinned}
  <main class="min-h-0 flex-1 overflow-y-auto">   ← scrolls alone
    {content}{gutterBox}
    {keyboard ? footer : null}                     ← in flow; scroll to reach it
  </main>
  {keyboard ? null : footer}                       ← a real flex sibling
</div>
```

**No keyboard**: the footer is a flex sibling with real layout space and `<main>` shrinks to fit above it.
Immovable by construction — no `sticky`, no `fixed`, no measured spacer, nothing that can lift at the end of a
scroll or be re-laid-out on the first paint.

**Keyboard up**: the footer renders at the end of the scroll content, `static`, reachable by scrolling —
which is what [CODE_STYLE §11](../../CODE_STYLE.md) asks for and why `FOOTER_DOCK` carried a `static` override
in the first place. The override goes away because there is no longer a `sticky` to override.

`FOOTER_DOCK`'s `sticky bottom-0 z-(--z-raised) mt-auto in-data-keyboard:static` is deleted. `-mx-5` is kept
only in the in-scroll position, where the footer is inside the body's `px-5`; outside it the sibling needs no
negative margin. `useBottomChrome` claims the box in both positions, so `--bottom-chrome` and `--toast-inset`
keep measuring the real thing.

This costs one remount of the footer subtree on keyboard open and close. The footer holds a button and no
focus — focus is in the field the keyboard was opened for — so there is nothing to lose.

### The flicker is a second bug

`BibleImportPage` renders `<AppScreen header>` with no footer while `!page.ready`, then swaps to
`<AppScreen fill header footer>`. `AppScreen` derives its sizer and its scroll inset from whether a footer
exists, so the swap re-lays out the scroll body on the first paint of real content. `ImportReviewPage` returns
`null` before its draft arrives and has the same shape.

Both are fixed the same way: one `AppScreen` whose footer is always mounted, with the loading state in the
body. The footer's button is already disabled while there is nothing to act on. `DeckCardStylePage` had the same
shape (a footer-less shell while the deck loads) and takes the same fix; its pinned preview keeps an empty pane
of the same height while it loads, since a pinned box arriving later shrinks the body just the same.
`CardEditorPage` stops deciding its footer from the data: it has the card-to-card footer whenever the route
edits a card with somewhere to navigate — a deck of one shows `1 / 1` with both ways shut — and it loads in
the body. `BibleImportPage`'s footer now stands on the passage step too, disabled, for the same reason.

### Testing

- With no keyboard the footer is a sibling of the scroll body; under `data-keyboard` it is inside it.
- The scroll body's inset and sizer do not change when a page's content becomes ready.

## E. Result screens

### What is wrong

`OutcomeOverlay` is `absolute inset-0` inside the session screen. It covers the cards and leaves the header
above it, so a finished session still wears the chrome of an unfinished one, and its numbers are two prose
lines and a pair of pills.

### Shape

`shared/ui/ResultScreen.tsx` replaces it: `fixed inset-0`, painted `bg-chrome`, so it reaches the top of the
app and the status bar matches it with nothing repainted — the bar is already that colour.

Structure, top to bottom: medallion, title, subtitle, a row of `StatTile`s, then the primary action above
`--p-safe-bottom` with any secondary action as a text button beside it. Motion is a scale-and-fade honouring
`prefers-reduced-motion`.

`StatTile` is reused with `tone="chrome"` — a quieter, centred tile on `bg-info-surface` (the chrome fill inside
`.chrome`) — rather than being forked. One tile component, two tones.

`ResultScreen` takes its actions as data (`{ label, onClick, icon? }`) and draws them itself, so every adopter gets
the same row: the secondary as a text button, the primary filling the rest. **Done** is the primary on all three
screens — match used to lead with Play again — so the same place always means the same thing.

Adopted by `StudySessionResult` (flashcards — renamed from `CompletionOverlay`, which is no longer an overlay),
`QuizComplete`, and match's completion. `OutcomeOverlay` is deleted.

Numbers shown: study — graded, known, still learning, and none at all when nothing was graded; quiz — correct,
questions and accuracy, and its retry action; match — time, moves and pairs, all of which `MatchBoard` already
computes. Three tiles each, so the row is one shape on every result screen. The title is **Study session
complete** — "Session" alone is the sign-in (`UBIQUITOUS_LANGUAGE`). New keys go in the existing i18n domain
files.

### Testing

- The screen wears `.chrome`, is `fixed inset-0`, and clears the top safe area.
- Stats render as a figure under a label, and the row is absent when there is nothing to count.
- Each adopter renders its stats and fires both its actions; a study session that graded nothing
  shows no tiles rather than three zeroes.

## Order of work

1. **A** — chrome tokens and the header sweep. Everything else is drawn on top of it.
2. **D** — the footer's two positions, and the two ready-swap fixes.
3. **C** — the filter preference, its schema step and the browse-mode line.
4. **B** — the two live bars, the palette, `useSortableList`.
5. **E** — `ResultScreen` and its three adopters.

Each step ends green on `npm run typecheck && npm run lint && npm run test`; A and D also run
`npm run build && npm run check:entry-graph`, having touched startup and imports.

## Verify on device

A, D and E all touch what [CODE_STYLE §11](../../CODE_STYLE.md) calls invisible on desktop: the status bar,
`env(safe-area-*)`, the keyboard, and a bottom-pinned box. `/dev/kitchen-sink`'s viewport probe before
theorising; a real device before believing.
