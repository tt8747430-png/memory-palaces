import { useMemo } from 'react'
import { selectExtensionFeature, usePreferencesStore } from '@/entities/preferences'
import { BIBLE_ID } from '../ids'

/**
 * Whether one of this extension's features is switched on. On is the default — a learner who never
 * opened the overview has all of it.
 */
export function useBibleFeature(feature: string): boolean {
  return usePreferencesStore(useMemo(() => selectExtensionFeature(BIBLE_ID, feature), [feature]))
}
