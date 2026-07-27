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
  filterCounts: StudyFilterCounts
  set: <K extends keyof StudySettings>(key: K, next: StudySettings[K]) => void
  setSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
}

interface Args {
  mode: StudyMode
  prefs: StudyPrefs
  onPrefsChange?: (prefs: StudyPrefs) => void
  wordSpaces: boolean
  onWordSpacesChange?: (value: boolean) => void
  shakeToUndo: boolean
  onShakeToUndoChange?: (value: boolean) => void
  swipeByMode: FlashcardSwipeByMode
  onSwipeByModeChange?: (config: FlashcardSwipeByMode) => void
  filter: StudyFilter
  filterCounts: StudyFilterCounts
  onFilterChange: (filter: StudyFilter) => void
}

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
