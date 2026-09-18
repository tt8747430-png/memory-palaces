import { BookOpen } from 'lucide-react'
import { type ExtensionManifest, extensionRoute } from '@/shared/lib'

export const BIBLE_ID = 'bible'
export const BIBLE_IMPORT_PATH = '/import/bible'
export const BIBLE_LIBRARY_PATH = '/settings/extensions/bible'

/** What an import link may carry: the deck the reader was already in. */
export interface BibleImportSearch extends Record<string, unknown> {
  deckId?: string
}

export function validateBibleImportSearch(search: Record<string, unknown>): BibleImportSearch {
  return typeof search.deckId === 'string' && search.deckId ? { deckId: search.deckId } : {}
}

export const bibleManifest: ExtensionManifest = {
  id: BIBLE_ID,
  icon: <BookOpen />,
  labelKey: 'bible:label',
  descriptionKey: 'bible:description',
  namespace: 'bible',
  loadMessages: () => import('./i18n/en').then((module) => module.bibleMessages),
  routes: [
    extensionRoute(
      BIBLE_IMPORT_PATH,
      () => import('./ui/BibleImportScreen'),
      'BibleImportScreen',
      validateBibleImportSearch,
    ),
    extensionRoute(
      BIBLE_LIBRARY_PATH,
      () => import('./ui/BibleLibraryScreen'),
      'BibleLibraryScreen',
    ),
  ],
  loadCollections: () =>
    import('./api/verse-schema').then((module) => [module.bibleVerseCollection]),
  detailPath: BIBLE_LIBRARY_PATH,
  contributions: {
    importOptions: [
      {
        id: 'bible',
        icon: <BookOpen className="size-5" aria-hidden />,
        tone: 'brand',
        titleKey: 'bible:label',
        subtitleKey: 'bible:importSubtitle',
        to: BIBLE_IMPORT_PATH,
      },
    ],
  },
  loadProvider: () => import('./ui/BibleProvider'),
}
