/** The id the registry, preferences and the runtime know the Bible extension by. */
export const BIBLE_ID = 'bible'

/** The key its verse collection is declared under, and its repository handed back by. */
export const BIBLE_VERSES = 'bibleVerses'

/**
 * The parts a learner may switch off one at a time. Switching one off never deletes anything: the
 * verses stay, their table keeps replicating, and switching it back on finds them where they were.
 */
export const BIBLE_FEATURES = {
  import: 'import',
  library: 'library',
  chapterDecks: 'chapterDecks',
} as const

/** Where its screens live. Named here so a screen can navigate to another without the manifest. */
export const BIBLE_PATHS = {
  import: '/import/bible',
  overview: '/settings/extensions/bible',
  developer: '/settings/extensions/bible/developer',
} as const
