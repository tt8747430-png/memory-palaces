import type { RxJsonSchema } from 'rxdb'
import type { Folder } from '@/entities/folder'
import type { Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import type { Preferences } from '@/entities/preferences'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'
import type { HistoryEntry } from '@/entities/learning-history'
import type { PendingChange } from '@/entities/pending-change'
import type { SyncState } from '@/entities/sync-state'
import { CONTENT_COLLECTIONS } from '@/shared/config/sync-tables'

export const deckSchema: RxJsonSchema<Deck> = {
  version: 4,
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
        algorithm: { type: 'string', enum: ['fast', 'spaced'] },
        newCardsPerDay: { type: 'number' },
        maxCardsPerDay: { type: 'number' },
        cardStyle: {
          type: 'object',
          properties: {
            preset: {
              type: 'string',
              enum: [
                'plain',
                'bold',
                'frost',
                'sky',
                'meadow',
                'marble',
                'notebook',
                'paper',
                'parchment',
                'chalk',
                'night',
              ],
            },
            font: { type: 'string', enum: ['default', 'serif', 'rounded', 'hand', 'mono'] },
            textSize: { type: 'number' },
            alignment: { type: 'string', enum: ['left', 'center', 'right'] },
          },
          required: ['preset', 'font', 'textSize', 'alignment'],
          additionalProperties: false,
        },
        tts: {
          type: 'object',
          properties: {
            side: { type: 'string', enum: ['front', 'back', 'both'] },
            rate: { type: 'number' },
          },
          required: ['side', 'rate'],
          additionalProperties: false,
        },
        advanced: {
          type: 'object',
          properties: {
            learningSteps: { type: 'array', items: { type: 'number' } },
            graduatingInterval: { type: 'number' },
            easyBonus: { type: 'number' },
            maximumInterval: { type: 'number' },
            leechThreshold: { type: 'number' },
          },
          required: [
            'learningSteps',
            'graduatingInterval',
            'easyBonus',
            'maximumInterval',
            'leechThreshold',
          ],
          additionalProperties: false,
        },
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
  version: 1,
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
    frozen: { type: 'boolean' },
    reversed: { type: 'boolean' },
    fastReview: { type: 'string', enum: ['notQuite', 'gotIt'] },
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
    'frozen',
    'reversed',
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
  version: 2,
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
    studyTypeInitialsOnly: { type: 'boolean' },
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
    selectToolbar: {
      type: 'object',
      properties: {
        library: { type: 'array', items: { type: 'string' } },
        card: { type: 'array', items: { type: 'string' } },
        question: { type: 'array', items: { type: 'string' } },
      },
      required: ['library', 'card', 'question'],
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
    'studyTypeInitialsOnly',
    'shakeToUndo',
    'swipe',
    'flashcardSwipe',
    'selectToolbar',
    'privacy',
  ],
}

export const profileSchema: RxJsonSchema<Profile> = {
  version: 2,
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
    phone: { type: 'string' },
    avatar: { type: ['string', 'null'] },
  },
  required: ['id', 'createdAt', 'updatedAt', 'name', 'username', 'email', 'bio', 'phone', 'avatar'],
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

/**
 * The Learning history. It mirrors to the cloud like the content collections, but records no
 * pending change: an entry is one answer at one moment and is never edited, so it cannot diverge
 * and there is nothing to ask anyone about. Its conflict handler is `firstWriteWins`.
 *
 * Only the four fields every entry has are required. The rest are decided by `kind`, and an absent
 * `intervalBefore` is load-bearing rather than merely optional: it is what says the Card had no
 * schedule yet, which `0` — where a lapse leaves a Card — does not.
 */
export const historySchema: RxJsonSchema<HistoryEntry> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    cardId: { type: 'string', maxLength: 100 },
    deckId: { type: 'string', maxLength: 100 },
    kind: { type: 'string', enum: ['graded', 'answered', 'mastered'] },
    grade: { type: 'string', enum: ['again', 'hard', 'good', 'easy'] },
    outcome: { type: 'string', enum: ['notQuite', 'gotIt'] },
    intervalBefore: { type: 'number' },
    intervalAfter: { type: 'number' },
    dueAfter: { type: 'string' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'cardId', 'deckId', 'kind'],
  indexes: ['cardId'],
}

/**
 * The device's log of writes a Sync has not confirmed yet.
 *
 * No `updatedAt`, and that is load-bearing twice over: it says the collection is device-local (it
 * is not in `SYNCED_TABLES`, and `RxdbRepository.remove` reads the absence of a clock as "no
 * tombstone needed"), and it keeps the log from competing on the same clock as the documents it
 * describes. `at` is when the write happened, for the user-facing ordering.
 *
 * `contentCollection` rather than the obvious `collection`: RxDB builds a document's prototype from
 * its schema and then assigns `this.collection` on the instance, so a field by that name shadows
 * the assignment with a getter and every document of this collection throws on construction. The
 * write still reaches storage and the read side dies afterwards, which is a log that poisons itself
 * on first use — v1 renames the field. See `schemas.test.ts`, which holds every schema to the rule.
 */
export const pendingChangeSchema: RxJsonSchema<PendingChange> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 140 },
    contentCollection: { type: 'string', enum: [...CONTENT_COLLECTIONS] },
    entityId: { type: 'string', maxLength: 100 },
    op: { type: 'string', enum: ['save', 'remove'] },
    at: { type: 'string' },
  },
  required: ['id', 'contentCollection', 'entityId', 'op', 'at'],
  indexes: ['contentCollection'],
}

/**
 * This device's sync bookkeeping. Device-local for the same reasons as `pendingChanges`, and a
 * singleton — there is one `sync-state` document, keyed by a constant.
 *
 * `checkpoints` is a map keyed by table name with no required keys, so adding a table to
 * `SYNCED_TABLES` is not a schema change. A missing key reads as "cloud position unknown", which
 * the next peek resolves by starting from the epoch.
 */
export const syncStateSchema: RxJsonSchema<SyncState> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    checkpoints: { type: 'object', additionalProperties: true },
    lastSyncedAt: { type: ['string', 'null'] },
    autosync: { type: 'boolean' },
    cloudChanged: { type: 'boolean' },
  },
  required: ['id', 'checkpoints', 'autosync', 'cloudChanged'],
}
