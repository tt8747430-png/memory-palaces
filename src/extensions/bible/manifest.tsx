import { BookOpen, FolderTree, Library } from 'lucide-react'
import { type ExtensionManifest, extensionRoute } from '@/shared/lib'
import { BIBLE_ID } from './ids'

const BIBLE_IMPORT_PATH = '/import/bible'
const BIBLE_OVERVIEW_PATH = '/settings/extensions/bible'
const BIBLE_DEVELOPER_PATH = '/settings/extensions/bible/developer'

/**
 * The parts a learner may switch off one at a time. Switching one off never deletes anything: the
 * verses stay, their table keeps replicating, and switching it back on finds them where they were.
 */
export const BIBLE_FEATURES = {
  import: 'import',
  library: 'library',
  chapterDecks: 'chapterDecks',
} as const

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
    extensionRoute(BIBLE_IMPORT_PATH, () => import('./ui/BibleImportScreen'), 'BibleImportScreen', {
      validateSearch: validateBibleImportSearch,
      feature: BIBLE_FEATURES.import,
    }),
    extensionRoute(
      BIBLE_DEVELOPER_PATH,
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
        to: BIBLE_IMPORT_PATH,
        feature: BIBLE_FEATURES.import,
      },
    ],
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
      BIBLE_OVERVIEW_PATH,
      () => import('./ui/BibleOverviewScreen'),
      'BibleOverviewScreen',
    ),
  },
}
