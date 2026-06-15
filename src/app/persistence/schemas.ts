import type { RxJsonSchema } from 'rxdb'
import type { Folder } from '@/entities/folder'
import type { Palace } from '@/entities/palace'
import type { Room } from '@/entities/room'
import type { Locus } from '@/entities/locus'

/**
 * RxDB JSON schemas for the persisted entities. They live at the composition layer
 * (not in `entities` or `shared`) so the dependency rule holds: this is the one
 * place that couples the entity shape to the concrete RxDB adapter. `RxJsonSchema<T>`
 * type-checks each schema against its entity, so drift is a compile error.
 */
export const palaceSchema: RxJsonSchema<Palace> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    icon: { type: 'string' },
    color: { type: 'string' },
    image: { type: 'string' },
    category: { type: 'string' },
    settings: {
      type: 'object',
      properties: {
        quizTimer: { type: 'boolean' },
        studyDirection: { type: 'string', enum: ['front', 'back'] },
        cardOrder: { type: 'string', enum: ['inOrder', 'shuffle', 'reverse'] },
        studyMode: { type: 'string', enum: ['review', 'browse'] },
        shuffleQuestions: { type: 'boolean' },
        shuffleCards: { type: 'boolean' },
        textToSpeech: { type: 'boolean' },
        sortIntoPiles: { type: 'boolean' },
      },
      required: [
        'quizTimer',
        'studyDirection',
        'cardOrder',
        'studyMode',
        'shuffleQuestions',
        'shuffleCards',
        'textToSpeech',
        'sortIntoPiles',
      ],
      additionalProperties: false,
    },
    folderId: { type: ['string', 'null'] },
    favorite: { type: 'boolean' },
    archived: { type: 'boolean' },
    bibleMode: { type: 'boolean' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'description',
    'icon',
    'color',
    'category',
    'settings',
    'folderId',
    'favorite',
    'archived',
    'bibleMode',
  ],
}

export const folderSchema: RxJsonSchema<Folder> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    name: { type: 'string' },
    color: { type: 'string' },
    icon: { type: 'string' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'name', 'color', 'icon'],
}

export const roomSchema: RxJsonSchema<Room> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    palaceId: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    description: { type: 'string' },
    order: { type: 'number' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'palaceId', 'title', 'description', 'order'],
}

export const locusSchema: RxJsonSchema<Locus> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    roomId: { type: 'string', maxLength: 100 },
    front: { type: 'string' },
    back: { type: 'string' },
    hint: { type: 'string' },
    tip: { type: 'string' },
    srs: {
      type: 'object',
      properties: {
        due: { type: 'string' },
        interval: { type: 'number' },
        ease: { type: 'number' },
        reps: { type: 'number' },
        lapses: { type: 'number' },
        lastReviewed: { type: 'string' },
      },
      required: ['due', 'interval', 'ease', 'reps', 'lapses', 'lastReviewed'],
      additionalProperties: false,
    },
    flagged: { type: 'boolean' },
    memorized: { type: 'boolean' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'roomId', 'front', 'back', 'flagged', 'memorized'],
}
