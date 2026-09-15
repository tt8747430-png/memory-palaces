import type {
  FlashcardSwipeAction,
  FlashcardSwipeConfig,
  SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import type { StudyMode } from '@/entities/preferences'
import type { StudyFilter, StudyFilterCounts } from '@/features/review'
import type { DeckStudyPrefs, EditableDeckPref, LearnerStudyPrefs, StudyDirection } from './types'

/**
 * Every study setting as one flat object, whichever of the three places it is stored in — the Deck,
 * the learner's Preferences, or the session itself. Sheets read this and call `set`; none of them
 * knows where any of it lives.
 */
export interface StudySettings {
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  shakeToUndo: boolean
  /** The current mode's map only. The other modes' maps are not this sheet's business. */
  swipe: FlashcardSwipeConfig
  filter: StudyFilter
}

export interface StudySettingsControl {
  value: StudySettings
  /** Prefs shown but not changeable here — the Deck being studied does not own them. `set` ignores them. */
  locked: ReadonlySet<EditableDeckPref>
  filterCounts: StudyFilterCounts
  set: <K extends keyof StudySettings>(key: K, next: StudySettings[K]) => void
  setSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
}

/**
 * Three channels, because a study setting has exactly three possible owners and each writes
 * somewhere different: the Deck, the learner, and the session. Not one per *field* — that was four
 * `value` + `onXChange` pairs for the learner's alone, and the module exists to collapse pairs
 * (CODE_STYLE §3a).
 */
interface Args {
  mode: StudyMode
  deckPrefs: DeckStudyPrefs
  onDeckPrefsChange?: (prefs: DeckStudyPrefs) => void
  /** Deck prefs this Deck does not own — a Subdeck's Main deck does. */
  lockedPrefs?: readonly EditableDeckPref[]
  learnerPrefs: LearnerStudyPrefs
  onLearnerPrefsChange?: (changes: Partial<LearnerStudyPrefs>) => void
  filter: StudyFilter
  filterCounts: StudyFilterCounts
  onFilterChange: (filter: StudyFilter) => void
}

/** Which owner each key answers to. The one place the routing is written down. */
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
    // The sheet edits one mode's map; the stored preference is all four, so the rest are carried
    // through untouched. The only place that spread is written.
    onLearnerPrefsChange?.({
      swipeByMode: { ...learnerPrefs.swipeByMode, [mode]: next as FlashcardSwipeConfig },
    })
  }

  return {
    value,
    locked,
    filterCounts,
    set,
    // One direction changing is still a whole-map write; going through `set` is what keeps the
    // per-mode spread above from being written a second time here.
    setSwipe: (direction, action) => set('swipe', { ...value.swipe, [direction]: action }),
  }
}
