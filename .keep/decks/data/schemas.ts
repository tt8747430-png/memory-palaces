import type { RxJsonSchema } from 'rxdb'
import type { Deck } from '../model/deck'
import type { Card } from '../model/card'
import type { Question } from '../model/question'
import type { Folder } from '../model/folder'

export const deckSchema: RxJsonSchema<Deck> = {
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
    folderId: { type: ['string', 'null'] },
    parentId: { type: ['string', 'null'] },
    order: { type: 'number' },
    favorite: { type: 'boolean' },
    archived: { type: 'boolean' },
    settings: {
      type: 'object',
      properties: {
        quizTimer: { type: 'boolean' },
        studyDirection: { type: 'string', enum: ['front', 'back'] },
        shuffleQuestions: { type: 'boolean' },
        shuffleCards: { type: 'boolean' },
        textToSpeech: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'description',
    'icon',
    'color',
    'folderId',
    'parentId',
    'order',
    'favorite',
    'archived',
    'settings',
  ],
}

export const cardSchema: RxJsonSchema<Card> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    deckId: { type: 'string', maxLength: 100 },
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
    order: { type: 'number' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'deckId',
    'front',
    'back',
    'flagged',
    'memorized',
    'order',
  ],
}

export const questionSchema: RxJsonSchema<Question> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    deckId: { type: 'string', maxLength: 100 },
    prompt: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } },
    correctAnswer: { type: 'number' },
    explanation: { type: 'string' },
    order: { type: 'number' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'deckId',
    'prompt',
    'options',
    'correctAnswer',
    'order',
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
    order: { type: 'number' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'name', 'color', 'icon', 'order'],
}
