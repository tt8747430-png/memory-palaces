import { BookMarked, BookOpen, FolderTree, Library, LibraryBig } from 'lucide-react'
import { type ExtensionManifest, extensionRoute } from '@/shared/lib'
import { BIBLE_FEATURES, BIBLE_ID, BIBLE_PATHS } from './ids'
import { BOOK_FILTERS, BY_GENRE, CANON_ORDER } from './model/deck-orders'
import { validateBibleImportSearch } from './model/import-search'

export const bibleManifest: ExtensionManifest = {
  id: BIBLE_ID,
  icon: <BookOpen />,
  labelKey: 'bible:label',
  descriptionKey: 'bible:description',
  namespace: 'bible',
  loadMessages: () => import('./i18n/en').then((module) => module.bibleMessages),
  routes: [
    extensionRoute(
      BIBLE_PATHS.import,
      () => import('./ui/BibleImportScreen'),
      'BibleImportScreen',
      {
        validateSearch: validateBibleImportSearch,
        feature: BIBLE_FEATURES.import,
      },
    ),
    extensionRoute(
      BIBLE_PATHS.developer,
      () => import('./ui/BibleDeveloperScreen'),
      'BibleDeveloperScreen',
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
        to: BIBLE_PATHS.import,
        feature: BIBLE_FEATURES.import,
      },
    ],
    deckSorts: [
      {
        ...CANON_ORDER,
        labelKey: 'bible:sort.canon',
        icon: <BookMarked className="size-4" aria-hidden />,
      },
      {
        ...BY_GENRE,
        labelKey: 'bible:sort.genre',
        icon: <LibraryBig className="size-4" aria-hidden />,
      },
    ],
    deckFilters: BOOK_FILTERS.map((filter) => ({
      ...filter,
      icon: <BookMarked className="size-4" aria-hidden />,
    })),
  },
  features: [
    {
      id: BIBLE_FEATURES.import,
      icon: <BookOpen className="size-4.5" aria-hidden />,
      labelKey: 'bible:features.import.label',
      descriptionKey: 'bible:features.import.description',
    },
    {
      id: BIBLE_FEATURES.library,
      icon: <Library className="size-4.5" aria-hidden />,
      labelKey: 'bible:features.library.label',
      descriptionKey: 'bible:features.library.description',
    },
    {
      id: BIBLE_FEATURES.chapterDecks,
      icon: <FolderTree className="size-4.5" aria-hidden />,
      labelKey: 'bible:features.chapterDecks.label',
      descriptionKey: 'bible:features.chapterDecks.description',
    },
  ],
  overview: {
    route: extensionRoute(
      BIBLE_PATHS.overview,
      () => import('./ui/BibleOverviewScreen'),
      'BibleOverviewScreen',
    ),
  },
}
