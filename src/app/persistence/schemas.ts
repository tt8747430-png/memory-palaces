import type { RxJsonSchema } from 'rxdb'
import type { Folder } from '@/entities/folder'
import type { Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import type { Preferences } from '@/entities/preferences'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'

/**
 * A deck is a self-referential tree node: `parentId` points at its parent deck (subdeck) or is
 * null (top-level, optionally filed via `folderId`). `settings` holds only overrides — every
 * inner field is optional and inherits up the tree (ADR-0002). No secondary indexes: like the
 * other collections, the store observes the whole set and filters in memory.
 */
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

export const progressSchema: RxJsonSchema<Progress> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    xp: { type: 'number' },
    streakCount: { type: 'number' },
    longestStreak: { type: 'number' },
    lastTrainingDate: { type: ['string', 'null'] },
    streakFreezes: { type: 'number' },
    bestQuizAccuracy: { type: 'number' },
    trainingDays: { type: 'array', items: { type: 'string' } },
    activeDayKey: { type: ['string', 'null'] },
    activeDayCount: { type: 'number' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'xp',
    'streakCount',
    'longestStreak',
    'lastTrainingDate',
    'streakFreezes',
    'bestQuizAccuracy',
    'trainingDays',
    'activeDayKey',
    'activeDayCount',
  ],
}

export const preferencesSchema: RxJsonSchema<Preferences> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    soundEffects: { type: 'boolean' },
    haptics: { type: 'boolean' },
    reducedMotion: { type: 'boolean' },
    notifications: { type: 'boolean' },
    theme: { type: 'string', enum: ['light', 'dark', 'system'] },
    language: { type: 'string' },
    dailyGoal: { type: 'number' },
    contentSort: { type: 'string', enum: ['manual', 'recent', 'name', 'due', 'flagged'] },
    studyMode: { type: 'string', enum: ['blur', 'words', 'initials', 'type'] },
    studyWordSpaces: { type: 'boolean' },
    shakeToUndo: { type: 'boolean' },
    swipe: {
      type: 'object',
      properties: {
        deck: { type: 'object' },
        folder: { type: 'object' },
        card: { type: 'object' },
      },
      required: ['deck', 'folder', 'card'],
      additionalProperties: false,
    },
    flashcardSwipe: {
      // One four-direction map per study mode. Inner shape validated at the entity layer
      // (`normalizeFlashcardSwipe`), like the list-row `swipe` field above.
      type: 'object',
      properties: {
        blur: { type: 'object' },
        words: { type: 'object' },
        initials: { type: 'object' },
        type: { type: 'object' },
      },
      required: ['blur', 'words', 'initials', 'type'],
      additionalProperties: false,
    },
    privacy: {
      type: 'object',
      properties: {
        profileVisibility: { type: 'boolean' },
        activitySharing: { type: 'boolean' },
        locationAccess: { type: 'boolean' },
        notificationTracking: { type: 'boolean' },
        dataEncryption: { type: 'boolean' },
      },
      required: [
        'profileVisibility',
        'activitySharing',
        'locationAccess',
        'notificationTracking',
        'dataEncryption',
      ],
      additionalProperties: false,
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'soundEffects',
    'haptics',
    'reducedMotion',
    'notifications',
    'theme',
    'language',
    'dailyGoal',
    'contentSort',
    'studyMode',
    'studyWordSpaces',
    'shakeToUndo',
    'swipe',
    'flashcardSwipe',
    'privacy',
  ],
}

export const profileSchema: RxJsonSchema<Profile> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    name: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' },
    bio: { type: 'string' },
    avatar: { type: ['string', 'null'] },
  },
  required: ['id', 'createdAt', 'updatedAt', 'name', 'username', 'email', 'bio', 'avatar'],
}

export const notificationSchema: RxJsonSchema<AppNotification> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    type: { type: 'string', enum: ['level-up', 'streak', 'quiz'] },
    read: { type: 'boolean' },
    xpGain: { type: 'number' },
    level: { type: 'number' },
    count: { type: 'number' },
    accuracy: { type: 'number' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'type', 'read'],
}
