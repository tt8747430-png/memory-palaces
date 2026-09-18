import type { RxJsonSchema } from 'rxdb'
import { lastWriteWins } from '@/shared/api/rxdb'
import type { ExtensionCollectionSpec } from '@/shared/lib'
import { BIBLE_VERSES } from '../ids'
import type { BibleVerse } from '../model/verse'

export const bibleVerseSchema: RxJsonSchema<BibleVerse> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    translation: { type: 'string' },
    book: { type: 'string' },
    chapter: { type: 'number' },
    verse: { type: 'number' },
    text: { type: 'string' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'translation', 'book', 'chapter', 'verse', 'text'],
}

export const bibleVerseCollection: ExtensionCollectionSpec = {
  key: BIBLE_VERSES,
  table: 'bible_verses',
  creator: { schema: bibleVerseSchema, conflictHandler: lastWriteWins<BibleVerse>() },
}
