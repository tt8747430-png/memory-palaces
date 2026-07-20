import { SingletonDocStore } from '@/shared/data/singleton-doc-store'
import { derived } from '@/shared/data/observable'
import type { Repository } from '@/shared/data'
import { DEFAULT_PREFERENCES } from '../model/preferences'
import type { Preferences } from '../model/preferences'
import type { RxJsonSchema } from 'rxdb'

export class PreferencesStore extends SingletonDocStore<Preferences> {
  readonly preferences = this.value
  /** Stored preferences, falling back to defaults before the first save. */
  readonly effective = derived(this.value, (preferences) => preferences ?? DEFAULT_PREFERENCES)

  constructor(repo: Repository<Preferences>) {
    super(repo)
  }
}

// Fresh start at version 0 (ADR-0005): the RxDB layer shipped preview-only, so
// the pre-Angular v1 schema and its selectToolbar migration were collapsed.
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
    'shakeToUndo',
    'swipe',
    'flashcardSwipe',
    'selectToolbar',
    'privacy',
  ],
}
