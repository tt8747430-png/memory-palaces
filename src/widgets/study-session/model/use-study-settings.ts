import type {
  FlashcardSwipeAction,
  FlashcardSwipeConfig,
  SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import type { StudyMode } from '@/entities/preferences'
import type { StudyFilter, StudyFilterCounts } from '@/features/review'
import type { DeckStudyPrefs, EditableDeckPref, LearnerStudyPrefs, StudyDirection } from './types'

export interface StudySettings {
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  shakeToUndo: boolean
  swipe: FlashcardSwipeConfig
  filter: StudyFilter
}

export interface StudySettingsControl {
  value: StudySettings
  locked: ReadonlySet<EditableDeckPref>
  filterCounts: StudyFilterCounts
  set: <K extends keyof StudySettings>(key: K, next: StudySettings[K]) => void
  setSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
}

interface Args {
  mode: StudyMode
  deckPrefs: DeckStudyPrefs
  onDeckPrefsChange?: (prefs: DeckStudyPrefs) => void
  lockedPrefs?: readonly EditableDeckPref[]
  learnerPrefs: LearnerStudyPrefs
  onLearnerPrefsChange?: (changes: Partial<LearnerStudyPrefs>) => void
  filter: StudyFilter
  filterCounts: StudyFilterCounts
  onFilterChange: (filter: StudyFilter) => void
}

const DECK_PREF = new Set<keyof StudySettings>(['direction', 'shuffle', 'textToSpeech'])
const LEARNER_PREF = new Set<keyof StudySettings>(['wordSpaces', 'typeInitialsOnly', 'shakeToUndo'])

export function useStudySettings({
  mode,
  deckPrefs,
  onDeckPrefsChange,
  lockedPrefs = [],
  learnerPrefs,
  onLearnerPrefsChange,
  filter,
  filterCounts,
  onFilterChange,
}: Args): StudySettingsControl {
  const locked = new Set(lockedPrefs)

  const value: StudySettings = {
    direction: deckPrefs.direction,
    shuffle: deckPrefs.shuffle,
    textToSpeech: deckPrefs.textToSpeech,
    wordSpaces: learnerPrefs.wordSpaces,
    typeInitialsOnly: learnerPrefs.typeInitialsOnly,
    shakeToUndo: learnerPrefs.shakeToUndo,
    swipe: learnerPrefs.swipeByMode[mode],
    filter,
  }

  const set: StudySettingsControl['set'] = (key, next) => {
    if (DECK_PREF.has(key)) {
      if (!locked.has(key as EditableDeckPref)) onDeckPrefsChange?.({ ...deckPrefs, [key]: next })
      return
    }
    if (LEARNER_PREF.has(key)) {
      onLearnerPrefsChange?.({ [key]: next })
      return
    }
    if (key === 'filter') {
      onFilterChange(next as StudyFilter)
      return
    }
    onLearnerPrefsChange?.({
      swipeByMode: { ...learnerPrefs.swipeByMode, [mode]: next as FlashcardSwipeConfig },
    })
  }

  return {
    value,
    locked,
    filterCounts,
    set,
    setSwipe: (direction, action) => set('swipe', { ...value.swipe, [direction]: action }),
  }
}
