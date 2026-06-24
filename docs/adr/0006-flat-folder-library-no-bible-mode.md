# The library is a flat folder explorer; Bible mode is removed

The home screen organised palaces with a horizontal **collection rail** of built-in chips
(All, Favorites, Bible, Unfiled, Archived) plus folder chips, a "N palaces" count row, and an
inline "+ Folder" affordance. Folders were a flat label you filtered by; a palace could be
"Bible-mode", which alone unlocked the verse-study modes and surfaced a Bible collection and
badge.

We replaced this with a **Windows-Explorer-style library**. The root level shows **folder
cards and unfiled palace cards together**. Tapping a folder enters it (`?folder=<id>` on the
home route, so the hardware Back button and deep links work) to reveal the palaces inside.
Folders and palaces are draggable: reorder within a level, or drag a palace onto a folder to
file it. The grid/list view and the sort apply to whichever level you're viewing.

**Sort gains a `manual` mode** alongside recent/name/progress/category; both folders and
palaces carry an `order` field. Starting a reorder-drag in an automatic mode flips the sort to
`manual` and persists the new order, so there's no dead-end between "drag to arrange" and "let
the app arrange".

**Folders are flat — they do not nest.** A folder holds palaces only; there are no subfolders.
This keeps navigation one level deep on a phone and the data model simple (a palace's
`folderId`, a folder/palace `order`). If deep nesting is wanted later, it's a deliberate
follow-up, not an accident of this design.

**Bible mode is gone.** Every practice mode is available on every palace and room by default —
Study cards, Match, Test, and Verses always show; the paste-verses importer is always offered.
The `bibleMode` field, the Bible collection, the Bible badge, and the Scripture category
default are removed.

**Selection mirrors the room editor.** A toolbar Select toggles checkboxes on every card; the
bulk bar is context-aware (palaces: move/favorite/archive/delete; folders: delete, which
unfiles their palaces; mixed: the common action only).

## Consequences

- `Palace` drops `bibleMode` and gains `order`; `Folder` gains `order` (RxDB schema bumps +
  migrations). Verse study is no longer gated, so any palace can open the verse modes.
- The built-in collections are gone. Favorite is now only a per-palace marker (and the
  "recent" sort still floats favorites); **Archived** is reached from a toolbar entry, not a
  chip. "Unfiled" is just the root level.
- Folder creation is toolbar-only (the SpeedDial); the inline rail "+ Folder" is removed.
- Drag-and-drop is provided by `@dnd-kit` (core + sortable). Hand-rolling nested
  sortable/droppable touch DnD was judged larger and more fragile than the dependency.
- Folders still never cascade-delete palaces (unchanged safety rule).
  </content>
