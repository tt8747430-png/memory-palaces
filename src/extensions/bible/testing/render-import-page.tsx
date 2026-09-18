import type { ReactNode } from 'react'
import { renderHook, type RenderHookResult } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { InMemoryRepository } from '@/shared/api'
import { i18n } from '@/shared/i18n'
import { started } from '@/shared/test/started'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { type Deck, DeckStoreContext } from '@/entities/deck'
import { createFolderStore, type Folder, FolderStoreContext } from '@/entities/folder'
import { ExtensionServicesContext } from '@/shared/lib'
import { BIBLE_ID } from '../ids'
import type { BibleServices } from '../model/context'
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
 * The stores the import screen reads, started over in-memory repositories. Built here rather than
 * in each test so a store added to the screen is added in one place.
 */
export function importStores(harness: ImportHarness = {}) {
  const deckStore = startedDeckStore(harness.decks ?? [])
  const cardStore = started(createCardStore(new InMemoryRepository<Card>(harness.cards ?? [])))
  const folderStore = started(
    createFolderStore(new InMemoryRepository<Folder>(harness.folders ?? [])),
  )
  const verseStore = started(
    createBibleVerseStore(new InMemoryRepository<BibleVerse>(harness.verses ?? [])),
  )
  return { deckStore, cardStore, folderStore, verseStore }
}

export type ImportStores = ReturnType<typeof importStores>

/** What the runtime would have published for an active Bible extension over these stores. */
const bibleServices = (stores: ImportStores): BibleServices => ({ verseStore: stores.verseStore })

const inStores = (stores: ImportStores, children: ReactNode) => (
  <DeckStoreContext value={stores.deckStore}>
    <CardStoreContext value={stores.cardStore}>
      <FolderStoreContext value={stores.folderStore}>
        <ExtensionServicesContext value={{ [BIBLE_ID]: bibleServices(stores) }}>
          {children}
        </ExtensionServicesContext>
      </FolderStoreContext>
    </CardStoreContext>
  </DeckStoreContext>
)

export function renderImportPage(page: ReactNode, harness: ImportHarness = {}): ImportStores {
  const stores = importStores(harness)
  renderWithProviders(inStores(stores, page))
  return stores
}

/** The state module's own test surface: the hook over the same stores, no page in between. */
export function renderImportHook<T>(
  hook: () => T,
  harness: ImportHarness = {},
): RenderHookResult<T, never> & ImportStores {
  const stores = importStores(harness)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{inStores(stores, children)}</I18nextProvider>
  )
  return { ...renderHook(hook, { wrapper }), ...stores }
}
