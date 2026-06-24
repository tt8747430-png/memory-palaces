import type { RxJsonSchema } from 'rxdb'
import type { Folder } from '@/entities/folder'
import type { Palace } from '@/entities/palace'
import type { Room } from '@/entities/room'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'
import type { Preferences } from '@/entities/preferences'
import type { Profile } from '@/entities/profile'
import type { AppNotification } from '@/entities/notification'

/**
 * RxDB JSON schemas for the persisted entities. They live at the composition layer
 * (not in `entities` or `shared`) so the dependency rule holds: this is the one
 * place that couples the entity shape to the concrete RxDB adapter. `RxJsonSchema<T>`
 * type-checks each schema against its entity, so drift is a compile error.
 */
export const palaceSchema: RxJsonSchema<Palace> = {
  version: 1,
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
    order: { type: 'number' },
    favorite: { type: 'boolean' },
    archived: { type: 'boolean' },
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
    'order',
    'favorite',
    'archived',
  ],
}

export const folderSchema: RxJsonSchema<Folder> = {
  version: 1,
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
  version: 1,
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
    order: { type: 'number' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'roomId',
    'front',
    'back',
    'flagged',
    'memorized',
    'order',
  ],
}

export const questionSchema: RxJsonSchema<Question> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    roomId: { type: 'string', maxLength: 100 },
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
    'roomId',
    'prompt',
    'options',
    'correctAnswer',
    'order',
  ],
}

export const progressSchema: RxJsonSchema<Progress> = {
  version: 1,
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
  version: 5,
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
    darkMode: { type: 'boolean' },
    language: { type: 'string' },
    dailyGoal: { type: 'number' },
    palacesView: { type: 'string', enum: ['grid', 'list'] },
    palacesSort: { type: 'string', enum: ['manual', 'recent', 'progress', 'name', 'category'] },
    verseMode: { type: 'string', enum: ['blur', 'words', 'initials', 'type'] },
    verseShuffle: { type: 'boolean' },
    verseWordSpaces: { type: 'boolean' },
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
    'darkMode',
    'language',
    'dailyGoal',
    'palacesView',
    'palacesSort',
    'verseMode',
    'verseShuffle',
    'verseWordSpaces',
    'privacy',
  ],
}

export const profileSchema: RxJsonSchema<Profile> = {
  version: 1,
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
