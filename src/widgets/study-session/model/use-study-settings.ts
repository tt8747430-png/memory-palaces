import { useState } from 'react'
import type {
  FlashcardSwipeAction,
  FlashcardSwipeByMode,
  FlashcardSwipeConfig,
  SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import type { StudyMode } from '@/entities/preferences'
import type { StudyFilter, StudyFilterCounts } from '@/features/review'
import type { StudyDirection, StudyPrefs } from './types'

/** Everything the gear sheet can change about the Study session in front of the learner. */
export interface StudySettings {
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  shakeToUndo: boolean
  /** The swipe map for the current mode only — each mode keeps its own. */
  swipe: FlashcardSwipeConfig
  filter: StudyFilter
}

export interface StudySettingsControl {
  value: StudySettings
  /** How many Cards each Study filter would leave, so a filter that empties the queue can hide. */
  filterCounts: StudyFilterCounts
  set: <K extends keyof StudySettings>(key: K, next: StudySettings[K]) => void
  /** One direction of the current mode's swipe map. */
  setSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
}

interface Args {
  mode: StudyMode
  /** Deck settings: orientation, shuffle and text-to-speech are stored per Deck. */
  prefs: StudyPrefs
  onPrefsChange?: (prefs: StudyPrefs) => void
  /** Preferences: these are global, not per Deck. */
  wordSpaces: boolean
  onWordSpacesChange?: (value: boolean) => void
  shakeToUndo: boolean
  onShakeToUndoChange?: (value: boolean) => void
  swipeByMode: FlashcardSwipeByMode
  onSwipeByModeChange?: (config: FlashcardSwipeByMode) => void
  /** The Study filter, which the session owns because changing it rebuilds the queue. */
  filter: StudyFilter
  filterCounts: StudyFilterCounts
  onFilterChange: (filter: StudyFilter) => void
}

/**
 * One place to read and write a Study session's settings, whatever each one is actually stored
 * in — the Deck, global Preferences, or the session itself. Callers name the setting and the new
 * value; where it lands is this module's business, and `typeInitialsOnly` (which nothing persists)
 * is indistinguishable from the rest at the interface.
 */
export function useStudySettings({
  mode,
  prefs,
  onPrefsChange,
  wordSpaces,
  onWordSpacesChange,
  shakeToUndo,
  onShakeToUndoChange,
  swipeByMode,
  onSwipeByModeChange,
  filter,
  filterCounts,
  onFilterChange,
}: Args): StudySettingsControl {
  const [typeInitialsOnly, setTypeInitialsOnly] = useState(false)

  const value: StudySettings = {
    direction: prefs.direction,
    shuffle: prefs.shuffle,
    textToSpeech: prefs.textToSpeech,
    wordSpaces,
    typeInitialsOnly,
    shakeToUndo,
    swipe: swipeByMode[mode],
    filter,
  }

  const set: StudySettingsControl['set'] = (key, next) => {
    switch (key) {
      case 'direction':
      case 'shuffle':
      case 'textToSpeech':
        onPrefsChange?.({ ...prefs, [key]: next })
        return
      case 'wordSpaces':
        onWordSpacesChange?.(next as boolean)
        return
      case 'typeInitialsOnly':
        setTypeInitialsOnly(next as boolean)
        return
      case 'shakeToUndo':
        onShakeToUndoChange?.(next as boolean)
        return
      case 'filter':
        onFilterChange(next as StudyFilter)
        return
      case 'swipe':
        onSwipeByModeChange?.({ ...swipeByMode, [mode]: next as FlashcardSwipeConfig })
    }
  }

  return {
    value,
    filterCounts,
    set,
    setSwipe: (direction, action) =>
      onSwipeByModeChange?.({
        ...swipeByMode,
        [mode]: { ...swipeByMode[mode], [direction]: action },
      }),
  }
}
