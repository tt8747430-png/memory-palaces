# The page owns the Selection; the list only reports what is on screen

Select mode has to replace the **screen header** — "Select all / *N* selected / Cancel" — on every
surface that can select (Library, a Deck's Cards, a Deck's Questions). The header belongs to the
page, but the count belongs to the list, which is the only thing that knows what sorting,
searching and filtering have left visible. We resolved it by moving the Selection *up*: the page
holds it (`useMultiSelect`, or `useLibrarySelection` where a row is a whole Subdeck subtree),
passes it to the list, and the list calls `setVisibleIds` with the rows it is currently showing.

## Considered options

- **List owns the Selection, page reads a summary.** Rejected: the summary has to travel upward
  every render, and the header's controls (`toggleAll`, `exit`) would have to travel back down as
  refs — state syncing in both directions for one bar.
- **List renders its own select bar under the page header.** This is what we had. It is why the
  deck screen showed the deck name, the count, *and* a second Done button: two headers, the same
  information twice. Rejected as the problem being fixed.
- **List portals its header into a slot the page provides.** Rejected: a DOM-level seam for what
  is really a state-ownership question, plus an empty header on first paint.

## Consequences

`DeckContentEditor` takes a `selection` prop rather than owning `selectMode` internally, which
reads oddly until you know why — hence this record. In exchange there is exactly one
`SelectHeader` component, one `SelectToolbarDock` placement, and one definition of what "select
all" means (the rows on screen, never the rows a filter is hiding).
