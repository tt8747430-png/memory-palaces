import type { ReactNode } from 'react'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { type Deck, DeckStoreContext } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { BibleVerseStoreContext } from '../model/context'
import { createBibleVerseStore } from '../model/store'
import type { BibleVerse } from '../model/verse'
import { startedDeckStore } from './decks'

export interface ImportHarness {
  decks?: Deck[]
  cards?: Card[]
  folders?: Folder[]
  verses?: BibleVerse[]
}

/**
 * The stores the import screen reads. Built here rather than in each test so a store added to the
 * screen is added in one place.
 */
export function renderImportPage(page: ReactNode, harness: ImportHarness = {}) {
  const deckStore = startedDeckStore(harness.decks ?? [])
  const cardStore = started(createCardStore(new InMemoryRepository<Card>(harness.cards ?? [])))
  const folderStore = started(
    createFolderStore(new InMemoryRepository<Folder>(harness.folders ?? [])),
  )
  const verseStore = started(
    createBibleVerseStore(new InMemoryRepository<BibleVerse>(harness.verses ?? [])),
  )
  renderWithProviders(
    <DeckStoreContext value={deckStore}>
      <CardStoreContext value={cardStore}>
        <FolderStoreContext value={folderStore}>
          <BibleVerseStoreContext value={verseStore}>{page}</BibleVerseStoreContext>
        </FolderStoreContext>
      </CardStoreContext>
    </DeckStoreContext>,
  )
  return { deckStore, cardStore, folderStore, verseStore }
}
