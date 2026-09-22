import { LibrarySelectList } from '@/widgets/deck-tree'
import type { Library } from '../model/use-library'
import { LibrarySelectBar } from './LibrarySelectBar'

export interface LibrarySelectViewProps {
  library: Library
}

/**
 * The Library while a selection is on: the arrange bar over the flat, draggable list of rows
 * being chosen among. Everything it shows is read off the page's one model (CODE_STYLE §3a), so
 * the page composes it with a single prop and keeps its own markup to the sheets it owns.
 */
export function LibrarySelectView({ library }: LibrarySelectViewProps) {
  const { selection, act } = library
  return (
    <div className="flex flex-col gap-1 pt-2">
      <LibrarySelectBar
        scopeName={library.scope?.name ?? null}
        sort={library.deckSort}
        onSortChange={library.setDeckSort}
        filter={library.filter}
        onFilterChange={library.setFilter}
        allSubdecks={library.allSubdecks}
        onAllSubdecksChange={library.setAllSubdecks}
        shown={library.sectionDecks.length}
        hidden={library.hidden}
        options={library.arrange}
      />
      <LibrarySelectList
        folders={library.sectionFolders}
        decks={library.sectionDecks}
        allDecks={library.decks}
        cards={library.cards}
        folderDeckCounts={library.folderDeckCounts}
        selectedIds={selection.ids}
        onToggleSelect={selection.toggle}
        onReorderFolders={act.reorderFolderIds}
        onReorderDecks={act.reorderDeckIds}
        onFileDecks={act.fileDecksIntoFolder}
        headings={library.headings}
        canReorderDecks={library.canReorderDecks}
        canReorderFolders={library.canReorderFolders}
      />
    </div>
  )
}
