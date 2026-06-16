import type { Profile } from './types'
import { DEFAULT_PROFILE } from './types'
import type { ProfileState } from './store'

export const selectProfile = (state: ProfileState): Profile | null => state.profile
export const selectIsReady = (state: ProfileState): boolean => state.status === 'ready'

/** The effective profile: the saved record, or the empty defaults until one exists. */
export const selectEffectiveProfile = (
  state: ProfileState,
): Pick<Profile, keyof typeof DEFAULT_PROFILE> => state.profile ?? DEFAULT_PROFILE
