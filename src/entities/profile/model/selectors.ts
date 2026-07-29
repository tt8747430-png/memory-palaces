import type { Profile } from './types'
import { DEFAULT_PROFILE } from './types'
import type { ProfileState } from './store'

export const selectEffectiveProfile = (
  state: ProfileState,
): Pick<Profile, keyof typeof DEFAULT_PROFILE> => state.profile ?? DEFAULT_PROFILE
