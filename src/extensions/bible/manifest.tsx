import { BookOpen } from 'lucide-react'
import { type ExtensionManifest, extensionRoute } from '@/shared/lib'
import { BIBLE_ID } from './ids'

const BIBLE_IMPORT_PATH = '/import/bible'
const BIBLE_LIBRARY_PATH = '/settings/extensions/bible'

/** What an import link may carry: the deck the learner was already in. */
interface BibleImportSearch extends Record<string, unknown> {
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
  ],
  loadCollections: () =>
    import('./api/verse-schema').then((module) => [module.bibleVerseCollection]),
  loadRuntime: () => import('./runtime'),
  contributions: {
    importOptions: [
      {
        id: BIBLE_ID,
        icon: <BookOpen className="size-5" aria-hidden />,
        tone: 'brand',
        titleKey: 'bible:label',
        subtitleKey: 'bible:importSubtitle',
        to: BIBLE_IMPORT_PATH,
      },
    ],
  },
  // How Bible text is published before a bundled translation exists.
  admin: {
    labelKey: 'bible:libraryTitle',
    route: extensionRoute(
      BIBLE_LIBRARY_PATH,
      () => import('./ui/BibleLibraryScreen'),
      'BibleLibraryScreen',
    ),
  },
}
